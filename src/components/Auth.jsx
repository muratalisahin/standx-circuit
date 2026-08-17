import React, { useState } from "react";
import Stander, { LOGO } from "./Stander.jsx";
import { enterX, savedXName } from "../lib/session.js";

export default function Auth({ onIn }) {
  const [name, setName] = useState(() => savedXName());
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const user = await enterX(name);
      onIn(user);
    } catch (ex) {
      setErr(ex.message || "Olmadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="authShell">
      <div className="authCard">
        <img className="authLogo" src={LOGO} alt="StandX" />
        <Stander pose="front" className="authMascot" />
        <h1>Giriş</h1>
        <p className="authAsk">X kullanıcınızın ismini yazınız.</p>
        <p>Yazıp girince tarayıcı bu kişiyi kaydeder. Sonraki açılışta aynı hesapla gelirsin.</p>
        <form onSubmit={submit}>
          <label>
            X kullanıcınızın ismi
            <input
              value={name}
              onChange={(e) => setName(e.target.value.replace(/^@/, ""))}
              placeholder="@isminiz"
              autoComplete="username"
              minLength={3}
              maxLength={20}
              required
              autoFocus
            />
          </label>
          {err && <p className="authErr">{err}</p>}
          <button type="submit" className="hudPlay" disabled={busy}>
            {busy ? "…" : "GİRİŞ YAP VE KAYDET"}
          </button>
        </form>
      </div>
    </div>
  );
}
