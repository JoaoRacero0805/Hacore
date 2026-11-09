import { describe, it, expect } from "vitest";
import { checkPosition, distanceMeters } from "@/lib/geo";
import { nextSaturdaySP, spInstant, todaySP } from "@/lib/time";

const place = { lat: -20.5386, lng: -47.4009, radius_m: 150 };

describe("geo", () => {
  it("distância aproximada", () => {
    const d = distanceMeters(place, { lat: place.lat + 0.009, lng: place.lng });
    expect(d).toBeGreaterThan(990);
    expect(d).toBeLessThan(1010);
  });
  it("dentro do raio, fora do raio, e folga limitada pela precisão", () => {
    expect(checkPosition(place, { lat: place.lat + 0.001, lng: place.lng, accuracy: 5 }).kind).toBe("ok"); // ~111 m
    expect(checkPosition(place, { lat: place.lat + 0.002, lng: place.lng, accuracy: 5 }).kind).toBe("far"); // ~222 m
    expect(checkPosition(place, { lat: place.lat + 0.002, lng: place.lng, accuracy: 80 }).kind).toBe("ok"); // 222 <= 150+80
    expect(checkPosition(place, { lat: place.lat + 0.004, lng: place.lng, accuracy: 5000 }).kind).toBe("far"); // folga máx 100 m
  });
  it("sem ponto definido ou sem posição = sem localização", () => {
    expect(checkPosition({ lat: null, lng: null, radius_m: 150 }, { lat: 1, lng: 1 }).kind).toBe("none");
    expect(checkPosition(place, null).kind).toBe("none");
    expect(checkPosition(place, { lat: NaN, lng: 1 }).kind).toBe("none");
  });
});

describe("time", () => {
  it("usa horário de Brasília", () => {
    expect(spInstant("2026-11-14", "16:30").toISOString()).toBe("2026-11-14T19:30:00.000Z");
    expect(todaySP(new Date("2026-11-15T02:00:00Z"))).toBe("2026-11-14");
  });
  it("próximo sábado", () => {
    expect(nextSaturdaySP(new Date("2026-11-09T15:00:00Z"))).toBe("2026-11-14");
    expect(nextSaturdaySP(new Date("2026-11-14T15:00:00Z"))).toBe("2026-11-14");
  });
});
