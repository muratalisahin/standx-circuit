import React, { useEffect, useMemo, useState } from "react";
import { fetchBoard } from "../lib/session.js";

export default function Leaderboard({ user, gameScore = 0, playing = false }) {
  const [board, setBoard] = useState({ top: [], users: 0 });
  const [fail, setFail] = useState("");

  const players = useMemo(() => {
    const top = [...(board.top || [])];
    if (user?.name && !top.some((r) => r.name.toLowerCase() === user.name.toLowerCase())) {
      top.push({ name: user.name, score: Number(gameScore) || 0, at: Date.now() });
    }
    top.sort((a, b) => (b.score || 0) - (a.score || 0) || (b.at || 0) - (a.at || 0));
    return top.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [board.top, user?.name, gameScore]);

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
        if (!stop) setFail("Sıralama sunucudan gelmedi.");
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

  return (
    <section className="board">
      <div className="boardHead">
        <strong>LİDERLİK</strong>
        <span>
          @{user?.name || "—"}
          {playing ? ` · ${gameScore} puan` : ""}
          {" · "}
          {Math.max(board.users, players.length)} kişi
        </span>
      </div>
      {fail && <p className="boardYou authErr">{fail}</p>}
      <ol className="boardList">
        {players.length === 0 && <li className="empty">Henüz kimse yok.</li>}
        {players.map((r) => (
          <li key={`${r.rank}-${r.name}`}>
            <div className={`run ${r.name === user?.name ? "on" : ""}`}>
              <em>{r.rank}</em>
              <b>@{r.name}</b>
              <strong>{r.score} puan</strong>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
