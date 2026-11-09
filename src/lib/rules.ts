import { checkPosition, type Position } from "./geo";
import type { Meeting, Store } from "./store/types";

export type CheckInResult =
  | { ok: true; location: "ok" | "none"; distance?: number }
  | { ok: false; reason: "not_found" | "not_open" | "closed" | "not_yet" | "far" | "already"; distance?: number };

/** A presença fica aberta do início da reunião até o fim da janela (padrão 23:59 do dia). */
export function meetingWindow(m: Pick<Meeting, "startsAt" | "closesAt" | "isVisible">, now: Date): "not_yet" | "open" | "closed" {
  if (now < m.startsAt) return "not_yet";
  if (now > m.closesAt) return "closed";
  return "open";
}

/**
 * Campista marcando a própria presença.
 * - Só dentro da janela de horário, em reunião visível do ciclo atual.
 * - Com localização: precisa estar dentro do raio do local.
 * - Sem localização (negada/falhou): a presença é registrada com a etiqueta "sem localização" para a coordenação revisar.
 * A posição recebida só é usada para o cálculo e nunca é gravada.
 */
export async function selfCheckIn(
  store: Store,
  input: { userId: string; meetingId: string; position: Position | null; now?: Date },
): Promise<CheckInResult> {
  const now = input.now ?? new Date();
  const meeting = await store.getMeeting(input.meetingId);
  if (!meeting || !meeting.isVisible) return { ok: false, reason: "not_found" };
  const cycle = await store.currentCycle();
  if (meeting.cycleId !== cycle.id) return { ok: false, reason: "closed" };
  const w = meetingWindow(meeting, now);
  if (w !== "open") return { ok: false, reason: w };

  const place = meeting.placeId ? await store.getPlace(meeting.placeId) : null;
  const geo = checkPosition(place ? { lat: place.lat, lng: place.lng, radius_m: place.radiusM } : null, input.position);
  if (geo.kind === "far") return { ok: false, reason: "far", distance: geo.distance };

  const created = await store.addPresence({
    meetingId: meeting.id,
    userId: input.userId,
    source: "self",
    location: geo.kind,
    markedBy: null,
  });
  if (!created) return { ok: false, reason: "already" };
  return { ok: true, location: geo.kind, distance: geo.kind === "ok" ? geo.distance : undefined };
}
