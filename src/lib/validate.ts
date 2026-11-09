export function str(fd: FormData, key: string, max = 200): string {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}

export function required(fd: FormData, key: string, label: string, max = 200): string {
  const v = str(fd, key, max);
  if (!v) throw new Error(`Preencha: ${label}.`);
  return v;
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1" || v === "sim";
}

export function date(fd: FormData, key: string, label: string): string {
  const v = str(fd, key, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) throw new Error(`Data inválida: ${label}.`);
  return v;
}

export function optionalDate(fd: FormData, key: string): string | null {
  const v = str(fd, key, 10);
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) throw new Error("Data inválida.");
  return v;
}

export function time(fd: FormData, key: string, label: string): string {
  const v = str(fd, key, 5);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) throw new Error(`Horário inválido: ${label}.`);
  return v;
}

export function optionalUrl(fd: FormData, key: string): string | null {
  const v = str(fd, key, 500);
  if (!v) return null;
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    return u.toString();
  } catch {
    throw new Error("Link inválido.");
  }
}

export function optionalNumber(fd: FormData, key: string, min: number, max: number): number | null {
  const raw = str(fd, key, 30).replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error("Número fora do intervalo.");
  return n;
}

export function email(v: string): string {
  const e = v.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error("Email inválido.");
  return e;
}

export function campYear(fd: FormData): { madeCamp: boolean; campYear: number | null } {
  const madeCamp = str(fd, "madeCamp") === "sim";
  if (!madeCamp) return { madeCamp, campYear: null };
  const y = Number(str(fd, "campYear", 4));
  const now = new Date().getFullYear();
  if (!Number.isInteger(y) || y < 1990 || y > now + 1) throw new Error("Informe o ano em que fez o Hacoré.");
  return { madeCamp, campYear: y };
}
