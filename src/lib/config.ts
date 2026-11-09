/** Sem login Google configurado, o app roda em modo demonstração (banco em memória, login de mentira). */
export function isDemo(): boolean {
  return !process.env.AUTH_GOOGLE_ID?.trim() || !process.env.AUTH_GOOGLE_SECRET?.trim();
}

/** Admins fixos vindos da variável ADMIN_EMAILS. */
export function envAdmins(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
