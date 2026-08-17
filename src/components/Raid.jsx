import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DepthXray from "./DepthXray.jsx";
import Stander, { LOGO, standerPose } from "./Stander.jsx";
import { BEST_KEY } from "../lib/board.js";
import { submitScore } from "../lib/session.js";
import { advanceBoss, makeIntercept, rankFor, resolveHit } from "../lib/intercepts.js";
const QUESTION_POINTS = 10;
const LIVES = 2;

export default function Raid({ overview, book, selected, onSip, sip, running, setRunning, hitRef, viewRef, hudEl, onScore }) {
  const [wave, setWave] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [margin, setMargin] = useState(LIVES);
  const [intercept, setIntercept] = useState(null);
  const [left, setLeft] = useState(0);
  const [flash, setFlash] = useState("");
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY) || 0));
  const busyRef = useRef(false);
  const interceptRef = useRef(null);
  const snapRef = useRef({});
  const failRef = useRef(() => {});
  const attemptRef = useRef(() => {});

  const symbols = overview?.symbols || [];
  const rank = rankFor(score);
  const pose = standerPose({ running, over, flash, kind: intercept?.kind, rankId: rank.id });
  const active = intercept?.steps ? intercept.steps[intercept.step || 0] : intercept;
  const sipOptions = active?.options || intercept?.options || null;

  snapRef.current = { margin, wave, score, combo, symbols, book, sip, selected, left };
  interceptRef.current = intercept;

  function spawn(nextWave) {
    const row = makeIntercept({
      symbols: snapRef.current.symbols,
      book: snapRef.current.book,
      wave: nextWave,
      selected: snapRef.current.selected,
    });
    setIntercept(row);
    setLeft(row.seconds);
    setWave(nextWave);
    onSip(row.sip?.id || snapRef.current.sip);
  }

  function start() {
    busyRef.current = false;
    setScore(0);
    setCombo(0);
    setMargin(LIVES);
    setOver(false);
    setFlash("");
    setIntercept(null);
    setWave(0);
    setRunning(true);
  }

  function fail(why) {
    if (busyRef.current) return;
    busyRef.current = true;
    setFlash(why || "MARGIN HIT");
    setCombo(0);
    const next = snapRef.current.margin - 1;
    setMargin(next);
    window.setTimeout(() => {
      busyRef.current = false;
      setFlash("");
      if (next <= 0) {
        const finalScore = snapRef.current.score;
        setOver(true);
        setRunning(false);
        setIntercept(null);
        setBest((b) => {
          const n = Math.max(b, finalScore);
          localStorage.setItem(BEST_KEY, String(n));
          submitScore(finalScore)
            .then(() => window.dispatchEvent(new Event("standx-board")))
            .catch(() => window.dispatchEvent(new Event("standx-board")));
          return n;
        });
      } else {
        spawn(snapRef.current.wave + 1);
      }
    }, 720);
  }

  function win() {
    if (busyRef.current) return;
    const gained = QUESTION_POINTS;
    setScore((s) => s + gained);
    setCombo((c) => c + 1);
    setFlash(`+${gained} puan`);
    busyRef.current = true;
    window.setTimeout(() => {
      busyRef.current = false;
      setFlash("");
      spawn(snapRef.current.wave + 1);
    }, 640);
  }

  function attempt(hit) {
    if (!running || over || !interceptRef.current || busyRef.current) return;
    const row = interceptRef.current;
    const ok = resolveHit(row, hit);
    if (!ok) {
      fail("WRONG WIRE");
      return;
    }
    if (row.steps) {
      const { done, intercept: next } = advanceBoss(row);
      if (!done) {
        setScore((s) => s + QUESTION_POINTS);
        setIntercept(next);
        setFlash(`+${QUESTION_POINTS} puan`);
        window.setTimeout(() => setFlash(""), 400);
        return;
      }
    }
    win();
  }

  useEffect(() => {
    if (!running) return;
    busyRef.current = false;
    setScore(0);
    setCombo(0);
    setMargin(LIVES);
    setOver(false);
    setFlash("");
    spawn(1);
  }, [running]);

  useEffect(() => {
    onScore?.({ score, best, running, over });
  }, [score, best, running, over, onScore]);

  useEffect(() => {
    failRef.current = fail;
    attemptRef.current = attempt;
    if (hitRef) hitRef.current = attempt;
    if (viewRef) {
      viewRef.current = {
        intercept,
        flash,
        wave,
        running,
        over,
        pose,
        kind: intercept?.kind,
      };
    }
  });

  useEffect(() => {
    if (!running || over || !intercept) return;
    const id = setInterval(() => {
      setLeft((ms) => {
        if (ms <= 1) {
          if (!busyRef.current) failRef.current("TIMEOUT — CURRENT DROPPED");
          return 0;
        }
        return ms - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, over, intercept]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
      if (!running) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          start();
        }
        return;
      }
      if (e.key === "b" || e.key === "B") attemptRef.current({ side: "BID" });
      if (e.key === "a" || e.key === "A") attemptRef.current({ side: "ASK" });
      if (e.key === "c" || e.key === "C") attemptRef.current({ kind: "core" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  const radio = useMemo(() => {
    if (over) return `Oyun bitti. Rütbe ${rank.id}. Tekrar dene.`;
    if (!running) return "Yeşil BAŞLAT’a bas. Sonra 3D halkadaki canlı piyasalara tıklayarak görevleri çöz.";
    if (flash) return flash;
    return intercept?.hint || "3D halkada cevap ver.";
  }, [over, running, flash, intercept, rank.id]);

  const modeNow = active?.mode || intercept?.mode;
  const questCard = (running && intercept) || over ? (
    <div className={`questCard ${flash ? "hot" : ""} ${over ? "dead" : ""}`}>
      {over ? (
        <>
          <div className="questTop">
            <b>BİTTİ · {rank.id}</b>
            <em>{score} puan</em>
          </div>
          <p>{rank.line}</p>
          <button type="button" className="hudPlay" onClick={start}>TEKRAR OYNA</button>
        </>
      ) : (
        <>
          <div className="questTop">
            <b>DALGA {wave} · {intercept.kind}</b>
            <em>{left}s</em>
          </div>
          <div className="raidBar">
            <i style={{ width: `${Math.max(4, (left / intercept.seconds) * 100)}%` }} />
          </div>
          <p>{flash && !flash.includes("LOCKED") ? flash : intercept.prompt}</p>
          <small>{intercept.hint}</small>
          {modeNow === "tap-side" && (
            <div className="questBtns">
              <button type="button" className="bid" onClick={() => attempt({ side: "BID" })}>ALIŞ (BID)</button>
              <button type="button" className="ask" onClick={() => attempt({ side: "ASK" })}>SATIŞ (ASK)</button>
            </div>
          )}
          {modeNow === "tap-sip" && sipOptions && (
            <div className="questBtns sip">
              {sipOptions.map((s) => (
                <button key={s.id} type="button" onClick={() => attempt({ sip: s.id })}>
                  {s.id} · {s.name}
                </button>
              ))}
            </div>
          )}
          {modeNow === "truth" && (
            <div className="questBtns">
              <button type="button" className="ok" onClick={() => attempt({ kind: "core" })}>DOĞRU</button>
              <button type="button" className="ask" onClick={() => attempt({ kind: "mod", symbol: selected || "BTC-USD" })}>YANLIŞ</button>
            </div>
          )}
          {(modeNow === "tap-core") && (
            <div className="questBtns">
              <button type="button" className="ok" onClick={() => attempt({ kind: "core" })}>STANDER / ÇEKİRDEK</button>
            </div>
          )}
          {modeNow === "tap-mod" && <small className="questHint">Cevap: 3D sahnedeki piyasaya tıkla.</small>}
        </>
      )}
    </div>
  ) : null;

  return (
    <>
      {hudEl && questCard ? createPortal(questCard, hudEl) : null}
    <aside className="inspector raidPanel">
      <div className="inspectHead">
        <div>
          <span className="kicker">STANDX OYUN</span>
          <h2>{running ? `DALGA ${wave}` : "BAŞLAT"}</h2>
        </div>
        <Stander pose={pose} className="inspectMascot" alt="" />
      </div>

      <div className="raidMeters">
        <div>
          <span>SCORE</span>
          <b>{score}</b>
        </div>
        <div>
          <span>COMBO</span>
          <b>{combo}×</b>
        </div>
        <div>
          <span>CAN</span>
          <b className={margin <= 1 ? "down" : ""}>
            {"●".repeat(Math.max(0, margin))}
            {"○".repeat(Math.max(0, LIVES - margin))}
          </b>
        </div>
      </div>

      <div className={`raidRadio ${flash ? "hot" : ""} ${over ? "dead" : ""}`}>
        <span>STANDER · COMMS</span>
        <p>{radio}</p>
      </div>

      {!running && !over && (
        <div className="raidIntro">
          <div className="raidCast">
            <img src={LOGO} alt="StandX" />
            <Stander pose="front" alt="" />
          </div>
          <p>
            1) Üstten <em>OYUN</em>’a bas (buradasın). 2) Aşağıdaki yeşil <em>BAŞLAT</em>’a bas.
            Görev canlı 3D halkada çıkar: en kalın boru, en büyük OI, funding, kitap, SIP. Doğruysa Stander’a (çekirdek), yalansa herhangi bir piyasaya tıkla.
          </p>
          <p className="tiny">Best {best} · Spark → Maker → Shield → Circuit → Universal</p>
          <button type="button" className="share" onClick={start}>
            BAŞLAT
          </button>
        </div>
      )}

      {running && intercept && (
        <>
          <div className="raidTask">
            <div className="raidTaskTop">
              <b>{intercept.kind}</b>
              <em>{left}s</em>
            </div>
            <div className="raidBar">
              <i style={{ width: `${Math.max(4, (left / intercept.seconds) * 100)}%` }} />
            </div>
            <p>{intercept.prompt}</p>
          </div>

          {(active?.mode === "tap-side" || intercept.mode === "tap-side") && (
            <>
              <DepthXray book={book} symbol={selected} />
              <div className="raidSides">
              <button type="button" className="bid" onClick={() => attempt({ side: "BID" })}>
                BID HEAVY
              </button>
              <button type="button" className="ask" onClick={() => attempt({ side: "ASK" })}>
                ASK HEAVY
              </button>
              </div>
            </>
          )}

          {sipOptions && (active?.mode === "tap-sip" || intercept.mode === "tap-sip") && (
            <div className="raidSips">
              {sipOptions.map((s) => (
                <button key={s.id} type="button" onClick={() => attempt({ sip: s.id })}>
                  {s.id}
                  <small>{s.name}</small>
                </button>
              ))}
            </div>
          )}

          {(active?.mode === "truth" || intercept.mode === "truth" || active?.mode === "tap-core" || intercept.mode === "tap-core") && (
            <button type="button" className="share" onClick={() => attempt({ kind: "core" })}>
              DUSD ÇEKİRDEĞE TIKLA
            </button>
          )}
        </>
      )}

      {over && (
        <div className="raidOver">
          <span className="kicker">{rank.id}</span>
          <p>{rank.line}</p>
          <p className="tiny">
            Score {score} · best {Math.max(best, score)} · last wave {wave}
          </p>
          <button type="button" className="share" onClick={start}>
            TEKRAR OYNA
          </button>
        </div>
      )}

      <p className="tiny">Cevap üstteki soru kutusunda ve 3D sahnede. Yatırım tavsiyesi değil.</p>
    </aside>
    </>
  );
}
