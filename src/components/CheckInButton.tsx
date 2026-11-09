"use client";

import { useState, useTransition } from "react";
import { checkIn } from "@/app/actions";

type Status =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "sending" }
  | { kind: "done"; location: "ok" | "none" }
  | { kind: "error"; text: string };

function getPosition(): Promise<{ lat: number; lng: number; accuracy: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => resolve(null), // negou ou falhou: segue sem localização
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

const REASONS: Record<string, string> = {
  far: "Você parece estar longe do local da reunião. Chegue mais perto e tente de novo.",
  not_yet: "A presença ainda não abriu. Ela abre no horário de início da reunião.",
  closed: "A presença desta reunião já fechou.",
  not_found: "Reunião não encontrada.",
  already: "Sua presença já estava registrada.",
};

export function CheckInButton({ meetingId }: { meetingId: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [, startTransition] = useTransition();

  async function go() {
    setStatus({ kind: "locating" });
    const pos = await getPosition();
    setStatus({ kind: "sending" });
    const r = await checkIn(meetingId, pos);
    if (r.ok) {
      setStatus({ kind: "done", location: r.location });
      startTransition(() => {});
    } else if (r.reason === "error") setStatus({ kind: "error", text: r.message });
    else if (r.reason === "far")
      setStatus({ kind: "error", text: `${REASONS.far}${r.distance ? ` (cerca de ${r.distance >= 1000 ? (r.distance / 1000).toFixed(1) + " km" : r.distance + " m"} do local)` : ""}` });
    else setStatus({ kind: "error", text: REASONS[r.reason] ?? "Não foi possível registrar." });
  }

  if (status.kind === "done")
    return (
      <div className="rounded-xl bg-ok-bg text-ok p-4 font-semibold" role="status">
        ✓ Presença registrada!
        {status.location === "none" && (
          <p className="mt-1 text-sm font-normal">
            Não conseguimos sua localização, então a presença ficou marcada para a coordenação conferir.
          </p>
        )}
      </div>
    );

  const busy = status.kind === "locating" || status.kind === "sending";
  return (
    <div className="flex flex-col gap-2">
      <button onClick={go} disabled={busy} className="btn btn-primary w-full py-4 text-lg">
        {status.kind === "locating" ? "Pegando sua localização…" : status.kind === "sending" ? "Registrando…" : "Marcar presença"}
      </button>
      <p className="text-xs text-hero-ink/70 text-center">
        O app vai pedir sua localização só para confirmar que você está na reunião. Ela não é guardada.
      </p>
      {status.kind === "error" && (
        <p role="alert" className="rounded-lg bg-danger-bg text-danger p-3 text-sm font-medium">
          {status.text}
        </p>
      )}
    </div>
  );
}
