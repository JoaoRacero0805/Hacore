// Horário de Brasília (America/Sao_Paulo). Sem horário de verão desde 2019, então UTC-3 fixo.
export const TZ = "America/Sao_Paulo";
const OFFSET = "-03:00";

/** "2026-11-14" + "16:30" → instante no fuso de Brasília. */
export function spInstant(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${OFFSET}`);
}

/** Data de hoje em Brasília, no formato YYYY-MM-DD. */
export function todaySP(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Hora (HH:MM) de um instante, em Brasília. */
export function timeSP(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
}

/** Data YYYY-MM-DD de um instante, em Brasília. */
export function dateSP(d: Date): string {
  return todaySP(d);
}

/** "14 de novembro de 2026". Aceita YYYY-MM-DD ou Date. */
export function formatDateLong(d: string | Date): string {
  const date = typeof d === "string" ? spInstant(d, "12:00") : d;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }).format(date);
}

/** "sáb, 14/11". */
export function formatDateShort(d: string | Date): string {
  const date = typeof d === "string" ? spInstant(d, "12:00") : d;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit" }).format(date);
}

export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);
}

/** Próximo sábado (ou hoje, se hoje for sábado), em Brasília. */
export function nextSaturdaySP(now: Date = new Date()): string {
  const today = spInstant(todaySP(now), "12:00");
  const dow = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(today);
  const idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(dow);
  const add = (6 - idx + 7) % 7;
  return todaySP(new Date(today.getTime() + add * 86400000));
}
