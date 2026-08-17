import React, { useEffect, useMemo, useState } from "react";
import { fetchJson, tradesUrl } from "../lib/api.js";
import { fetchBoard } from "../lib/session.js";
import { money, pct } from "../lib/format.js";

export default function Leaderboard({ symbols = [], selected, onSelect, user, gameScore = 0, playing = false }) {
  const [tab, setTab] = useState("oyun");
  const [board, setBoard] = useState({ top: [], recent: [], users: 0 });
  const [tape, setTape] = useState([]);
  const [fail, setFail] = useState("");

  const players = useMemo(() => {
    const top = [...(board.top || [])];
    if (user?.name && !top.some((r) => r.name.toLowerCase() === user.name.toLowerCase())) {
      top.push({ name: user.name, score: Number(gameScore) || 0, at: Date.now() });
    }
    top.sort((a, b) => (b.score || 0) - (a.score || 0) || (b.at || 0) - (a.at || 0));
    return top.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [board.top, user?.name, gameScore]);

  const ranked = useMemo(() => {
    const rows = [...symbols];
    if (tab === "oi") rows.sort((a, b) => Number(b.open_interest_notional || 0) - Number(a.open_interest_notional || 0));
    else if (tab === "chg") rows.sort((a, b) => Math.abs(Number(b.price_change_pct || 0)) - Math.abs(Number(a.price_change_pct || 0)));
    else rows.sort((a, b) => Number(b.volume_quote_24h || 0) - Number(a.volume_quote_24h || 0));
    return rows;
  }, [symbols, tab]);

  const leader = ranked[0]?.symbol;

  useEffect(() => {
    let stop = false;
    const pull = async () => {
      try {
        const j = await fetchBoard();
        if (!stop && j?.board) {
          setBoard(j.board);
          setFail("");
        }
      } catch {
        if (!stop) setFail("Sunucu sıralamayı vermedi. Vercel’e Supabase anahtarları yazılmamış olabilir.");
      }
    };
    pull();
    const id = setInterval(pull, 4000);
    window.addEventListener("standx-board", pull);
    return () => {
      stop = true;
      clearInterval(id);
      window.removeEventListener("standx-board", pull);
    };
  }, []);

  useEffect(() => {
    if (!leader) return;
    let stop = false;
    const pull = async () => {
      try {
        const j = await fetchJson(tradesUrl(leader));
        if (!stop && Array.isArray(j)) setTape(j.slice(0, 8));
      } catch {
        if (!stop) setTape([]);
      }
    };
    pull();
    const id = setInterval(pull, 2500);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [leader]);

  return (
    <section className="board">
      <div className="boardHead">
        <div>
          <span className="kicker">SIRALAMA</span>
          <strong>Oyuncu tablosu</strong>
        </div>
        <div className="live">
          <i />
          canlı
        </div>
      </div>

      <div className="boardTabs">
        <button type="button" className={tab === "oyun" ? "on" : ""} onClick={() => setTab("oyun")}>Oyuncular</button>
        <button type="button" className={tab === "vol" ? "on" : ""} onClick={() => setTab("vol")}>24s hacim</button>
        <button type="button" className={tab === "oi" ? "on" : ""} onClick={() => setTab("oi")}>Open interest</button>
        <button type="button" className={tab === "chg" ? "on" : ""} onClick={() => setTab("chg")}>Hareket</button>
      </div>

      {tab !== "oyun" && (
        <ol className="boardList">
          {ranked.map((m, i) => {
            const vol = Number(m.volume_quote_24h || 0);
            const oi = Number(m.open_interest_notional || 0);
            const chg = Number(m.price_change_pct || 0);
            const metric = tab === "oi" ? money(oi) : tab === "chg" ? pct(chg) : money(vol);
            return (
              <li key={m.symbol}>
                <button
                  type="button"
                  className={selected === m.symbol ? "on" : ""}
                  onClick={() => onSelect?.(m.symbol)}
                >
                  <em>{i + 1}</em>
                  <b>{m.base || m.symbol}</b>
                  <span className={chg >= 0 ? "up" : "down"}>{pct(chg)}</span>
                  <strong>{metric}</strong>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {tab === "oyun" && (
        <div className="boardGame">
          {fail && <p className="boardYou authErr">{fail}</p>}
          <p className="boardYou">
            Sen: <b>@{user?.name || "—"}</b>
            {playing ? ` · bu koşu ${gameScore} puan` : ""}
            {" · "}
            {Math.max(board.users, players.length)} kişi
          </p>
          <ol className="boardList">
            {players.length === 0 && <li className="empty">Henüz kimse yok.</li>}
            {players.map((r) => (
              <li key={`${r.rank}-${r.name}`}>
                <div className={`run ${r.name === user?.name ? "on" : ""}`}>
                  <em>{r.rank}</em>
                  <b>@{r.name}</b>
                  <span>{r.at ? new Date(r.at).toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—"}</span>
                  <strong>{r.score} puan</strong>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {tab !== "oyun" && (
        <div className="tape">
          <span className="kicker">CANLI İŞLEMLER · {leader || "—"}</span>
          {tape.length === 0 && <p>İşlem bandı yükleniyor…</p>}
          <ul>
            {tape.map((t, i) => (
              <li key={`${t.time}-${i}`} className={t.is_buyer_taker ? "down" : "up"}>
                <b>{t.is_buyer_taker ? "SAT" : "AL"}</b>
                <span>{Number(t.price).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</span>
                <em>{Number(t.quote_qty).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} DUSD</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
