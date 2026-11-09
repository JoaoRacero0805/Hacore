"use client";

import { useState } from "react";

type U = { name: string; email: string; madeCamp: boolean; campYear: number | null; onboarded: boolean };

export function ProfileFields({ user, showEmail = true }: { user: U; showEmail?: boolean }) {
  const [made, setMade] = useState(user.onboarded ? (user.madeCamp ? "sim" : "nao") : "");
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 1999 }, (_, i) => thisYear - i);
  return (
    <>
      <label className="field">
        <span>Nome completo</span>
        <input className="input" name="name" defaultValue={user.name} required minLength={2} maxLength={100} autoComplete="name" />
      </label>
      {showEmail && (
        <label className="field">
          <span>Email</span>
          <input className="input opacity-70" value={user.email} readOnly disabled />
        </label>
      )}
      <fieldset className="field">
        <span>Você já fez o acampamento Hacoré?</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["sim", "Sim, já fiz"],
            ["nao", "Ainda não"],
          ].map(([v, label]) => (
            <label key={v} className={`btn ${made === v ? "btn-primary" : "btn-secondary"}`}>
              <input type="radio" name="madeCamp" value={v} checked={made === v} onChange={() => setMade(v)} className="sr-only" required />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {made === "sim" && (
        <label className="field">
          <span>Em que ano?</span>
          <select className="input" name="campYear" defaultValue={user.campYear ?? ""} required>
            <option value="" disabled>
              Escolha o ano
            </option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}
