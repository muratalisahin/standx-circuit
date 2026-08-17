import React from "react";
import { SIPS } from "../lib/sips.js";

export default function Anatomy({ open, onOpen }) {
  const active = SIPS.find((s) => s.id === open) || SIPS[4];

  return (
    <section className="anatomy">
      <div className="anatomyTop">
        <div>
          <span className="kicker">PROTOCOL ANATOMY</span>
          <strong>SIP-1 — SIP-5</strong>
        </div>
        <p className="anatomyNote">Hover a SIP to light the matching live layer. Lore is the rule. Live is what this screen can actually show. Not a vault explorer.</p>
      </div>
      <div className="sipRow">
        {SIPS.map((s) => (
          <button
            key={s.id}
            className={s.id === open ? "on" : ""}
            onMouseEnter={() => onOpen(s.id)}
            onFocus={() => onOpen(s.id)}
            onClick={() => onOpen(s.id)}
            type="button"
          >
            {s.id}
            <small>{s.name}</small>
          </button>
        ))}
      </div>
      <div className="sipBody">
        <div>
          <span className="tag lore">PROTOCOL</span>
          <p>{active.lore}</p>
        </div>
        <div>
          <span className="tag live">LIVE DATA</span>
          <p>{active.live}</p>
        </div>
      </div>
    </section>
  );
}
