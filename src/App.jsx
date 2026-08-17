import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import Circuit from "./components/Circuit.jsx";
import DepthXray from "./components/DepthXray.jsx";
import Anatomy from "./components/Anatomy.jsx";
import Spark from "./components/Spark.jsx";
import { depthUrl, fetchJson, klineUrl, marketUrl, parseDepth, parseKlines } from "./lib/api.js";
import { layoutCircuit } from "./lib/circuitLayout.js";
import { bps, funding, money, pct, px } from "./lib/format.js";

export default function App() {
  const stageRef = useRef(null);
  const shotRef = useRef(null);
  const prevMark = useRef({});
  const [size, setSize] = useState({ w: 900, h: 640 });
  const [overview, setOverview] = useState(null);
  const [selected, setSelected] = useState("BTC-USD");
  const [book, setBook] = useState(null);
  const [bars, setBars] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [sip, setSip] = useState("SIP-5");
  const [syncedAt, setSyncedAt] = useState(null);
  const [clock, setClock] = useState(() => new Date());
  const [ticks, setTicks] = useState({});

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(260, Math.round(r.width));
      const h = Math.max(260, Math.round(r.height || r.width));
      setSize({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadOverview = useCallback(async () => {
    const o = await fetchJson(marketUrl());
    if (!o?.symbols?.length) throw new Error("empty");
    const next = {};
    for (const s of o.symbols) {
      const mark = Number(s.mark_price || s.last_price);
      const prev = prevMark.current[s.symbol];
      next[s.symbol] = prev == null || prev === mark ? 0 : mark > prev ? 1 : -1;
      prevMark.current[s.symbol] = mark;
    }
    setTicks(next);
    setOverview(o);
    setSyncedAt(new Date());
    setErr("");
    setSelected((prev) => prev || o.symbols[0].symbol);
  }, []);

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        await loadOverview();
      } catch {
        if (!stop) setErr("StandX engine feed could not be loaded.");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    const id = setInterval(() => {
      if (!document.hidden) loadOverview().catch(() => {});
    }, 2500);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [loadOverview]);

  useEffect(() => {
    if (!selected) return;
    let stop = false;
    const pull = async () => {
      try {
        const [raw, m] = await Promise.all([
          fetchJson(depthUrl(selected)),
          fetchJson(marketUrl(selected)).catch(() => overview?.symbols.find((s) => s.symbol === selected)),
        ]);
        if (stop) return;
        setBook(parseDepth(raw, m));
        setSyncedAt(new Date());
      } catch {
        if (!stop) setBook(null);
      }
    };
    pull();
    const id = setInterval(pull, 2000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    let stop = false;
    const pull = async () => {
      const to = Math.floor(Date.now() / 1000);
      const from = to - 60 * 60 * 12;
      try {
        const j = await fetchJson(klineUrl(selected, "60", from, to));
        if (!stop) setBars(parseKlines(j));
      } catch {
        if (!stop) setBars([]);
      }
    };
    pull();
    const id = setInterval(pull, 15000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [selected]);

  const layout = useMemo(() => {
    if (!overview?.symbols) return null;
    return layoutCircuit(overview.symbols, size.w, size.h);
  }, [overview, size]);

  const market = overview?.symbols.find((s) => s.symbol === selected) || overview?.symbols[0];

  useEffect(() => {
    const onKey = (e) => {
      if (!overview?.symbols?.length) return;
      if (e.target.tagName === "INPUT") return;
      const ordered = layout?.nodes.map((n) => n.symbol) || overview.symbols.map((s) => s.symbol);
      if (e.key >= "1" && e.key <= "9") {
        const i = Number(e.key) - 1;
        if (ordered[i]) setSelected(ordered[i]);
      }
      if (e.key === "0" && ordered[9]) setSelected(ordered[9]);
      if ((e.key === "-" || e.key === "_") && ordered[10]) setSelected(ordered[10]);
      if (e.key === "Escape") setSelected(ordered[0]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overview, layout]);

  async function share() {
    if (!shotRef.current) return;
    try {
      const dataUrl = await toPng(shotRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#070a08" });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `standx-circuit-${selected || "engine"}.png`;
      a.click();
      setSharing(false);
    } catch {
      setSharing(false);
    }
  }

  const summary = overview?.summary;
  const age = syncedAt ? Math.max(0, Math.round((clock - syncedAt) / 1000)) : null;

  return (
    <div className="shell">
      <header>
        <div className="brand">
          <img className="brandLogo" src="/images/standx-logo.png" alt="StandX" />
          STANDX <b>CIRCUIT</b>
        </div>
        <p className="line">Watch the engine. DUSD core. Live StandX feed.</p>
        <div className="live">
          <i />
          LIVE · {clock.toLocaleTimeString()} · {age == null ? "SYNC" : age === 0 ? "NOW" : `${age}s`}
        </div>
      </header>

      {loading && (
        <div className="boot">
          <img className="bootMascot" src="/images/stander-think.png" alt="" />
          <span>SYNCING ENGINE</span>
        </div>
      )}

      {err && <div className="error">{err}</div>}

      {!loading && !err && (
        <div className="workspace" ref={shotRef}>
          <div className="stampBar">
            <img className="stampLogo" src="/images/standx-logo.png" alt="" />
            <span>STANDX CIRCUIT</span>
            <span>{selected || "ENGINE"}</span>
            <span>DUSD CORE · LIVE · NOT INVESTMENT ADVICE</span>
          </div>
          <div className="stageCol">
            <div className="coreStats">
              <div>
                <span>24H VOLUME</span>
                <b>{money(summary?.volume_quote_24h)}</b>
              </div>
              <div>
                <span>OPEN INTEREST</span>
                <b>{money(summary?.open_interest_notional)}</b>
              </div>
              <div>
                <span>STANDER · DUSD</span>
                <b className="soft">yield-bearing margin</b>
              </div>
            </div>
            <div className="stage" ref={stageRef}>
              <Circuit
                layout={layout}
                selected={selected}
                onSelect={(s) => setSelected(s || selected)}
                ticks={ticks}
                sip={sip}
                imbalance={book?.imbalance}
              />
            </div>
            <p className="keys">2.5s markets · 2s book · tap a module · SIP lights a layer</p>
          </div>

          <aside className="inspector">
            <div className="inspectHead">
              <div>
                <span className="kicker">LIVE MODULE</span>
                <h2>{market?.symbol || "—"}</h2>
              </div>
              <img className="inspectMascot" src="/images/stander-focus.png" alt="" />
            </div>
            <div className="markRow">
              <strong>{px(market?.mark_price || market?.last_price)}</strong>
              <em className={Number(market?.price_change_pct) >= 0 ? "up" : "down"}>{pct(market?.price_change_pct)}</em>
            </div>
            <Spark bars={bars} />
            <dl>
              <div>
                <dt>Open interest</dt>
                <dd>{money(market?.open_interest_notional)}</dd>
              </div>
              <div>
                <dt>24h volume</dt>
                <dd>{money(market?.volume_quote_24h)}</dd>
              </div>
              <div>
                <dt>Funding</dt>
                <dd>{funding(market?.funding_rate)}</dd>
              </div>
              <div>
                <dt>Spread</dt>
                <dd>{bps(book?.spreadBps)}</dd>
              </div>
              <div>
                <dt>Book bias</dt>
                <dd className={book?.imbalance >= 0 ? "up" : "down"}>
                  {book ? `${book.imbalance >= 0 ? "BID" : "ASK"} ${(Math.abs(book.imbalance) * 100).toFixed(0)}%` : "—"}
                </dd>
              </div>
            </dl>
            <DepthXray book={book} symbol={market?.symbol} />
            <a
              className="trade"
              href={`https://standx.com/perps?symbol=${encodeURIComponent(market?.symbol || "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              TRADE ON STANDX
            </a>
            <button type="button" className="share" onClick={() => { setSharing(true); setTimeout(share, 40); }}>
              STAMP CIRCUIT PNG
            </button>
            <p className="tiny">Live numbers from StandX public market, depth and kline. No vault TVL. Not investment advice.</p>
          </aside>
        </div>
      )}

      <Anatomy open={sip} onOpen={setSip} />
      <footer>
        <img className="footMascot" src="/images/stander-34.png" alt="" />
        StandX Circuit · Stander on DUSD · protocol map, not a vault explorer · not investment advice
        {sharing ? " · rendering stamp…" : ""}
      </footer>
    </div>
  );
}
