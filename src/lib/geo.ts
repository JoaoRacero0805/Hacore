/** Distância em metros entre dois pontos (fórmula de haversine). */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Folga máxima dada pela imprecisão do GPS (em salão coberto o GPS costuma errar bastante). */
export const MAX_ACCURACY_SLACK_M = 100;

export type Position = { lat: number; lng: number; accuracy?: number };

export type GeoCheck =
  | { kind: "ok"; distance: number }
  | { kind: "far"; distance: number }
  | { kind: "none" }; // sem localização (negada, falhou, ou o local não tem ponto definido)

export function checkPosition(
  place: { lat: number | null; lng: number | null; radius_m: number } | null,
  pos: Position | null,
): GeoCheck {
  if (!pos || !place || place.lat == null || place.lng == null) return { kind: "none" };
  if (!Number.isFinite(pos.lat) || !Number.isFinite(pos.lng) || Math.abs(pos.lat) > 90 || Math.abs(pos.lng) > 180) return { kind: "none" };
  const distance = Math.round(distanceMeters(pos, { lat: place.lat, lng: place.lng }));
  const slack = Math.min(Math.max(pos.accuracy ?? 0, 0), MAX_ACCURACY_SLACK_M);
  return distance <= place.radius_m + slack ? { kind: "ok", distance } : { kind: "far", distance };
}
