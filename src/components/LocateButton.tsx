"use client";

import { useState } from "react";

/** Preenche os campos lat/lng do formulário com a localização atual do celular do admin. */
export function LocateButton({ latId, lngId }: { latId: string; lngId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  function locate() {
    if (!navigator.geolocation) return setMsg("Este navegador não tem localização.");
    setMsg("Pegando localização…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        (document.getElementById(latId) as HTMLInputElement).value = p.coords.latitude.toFixed(6);
        (document.getElementById(lngId) as HTMLInputElement).value = p.coords.longitude.toFixed(6);
        setMsg(`Ponto preenchido (precisão de ~${Math.round(p.coords.accuracy)} m). Não esqueça de salvar.`);
      },
      () => setMsg("Não foi possível pegar a localização. Verifique a permissão."),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={locate} className="btn btn-secondary">
        📍 Usar minha localização atual
      </button>
      {msg && <p className="text-xs text-muted">{msg}</p>}
    </div>
  );
}
