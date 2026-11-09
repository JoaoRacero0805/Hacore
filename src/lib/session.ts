import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";
import { envAdmins, isDemo } from "./config";
import { getStore } from "./store";
import type { User } from "./store/types";

export const DEMO_COOKIE = "hacore_demo";
export const DEMO_ADMIN = "admin@demo.hacore";

type Viewer = { email: string; name: string; image: string | null };

async function getViewer(): Promise<Viewer | null> {
  if (isDemo()) {
    const email = (await cookies()).get(DEMO_COOKIE)?.value;
    if (!email) return null;
    return { email, name: email === DEMO_ADMIN ? "Coordenação (demo)" : email.split("@")[0], image: null };
  }
  const s = await auth();
  const email = s?.user?.email?.toLowerCase();
  if (!email) return null;
  return { email, name: s?.user?.name || email.split("@")[0], image: s?.user?.image ?? null };
}

export async function isAdminEmail(email: string): Promise<boolean> {
  const e = email.toLowerCase();
  if (envAdmins().includes(e)) return true;
  if (isDemo() && e === DEMO_ADMIN) return true;
  return (await getStore()).isAdminInDb(e);
}

/** Usuário logado (cria o registro no primeiro acesso). Uma vez por requisição. */
export const getCurrent = cache(async (): Promise<{ user: User; isAdmin: boolean } | null> => {
  const v = await getViewer();
  if (!v) return null;
  const store = await getStore();
  const user = await store.upsertUserFromLogin({ email: v.email, name: v.name, photoUrl: v.image });
  return { user, isAdmin: await isAdminEmail(v.email) };
});

/** Para páginas: exige login e cadastro inicial completo. */
export async function requireUser() {
  const c = await getCurrent();
  if (!c) redirect("/");
  if (!c.user.onboarded) redirect("/bem-vindo");
  return c;
}

export async function requireAdmin() {
  const c = await requireUser();
  if (!c.isAdmin) redirect("/inicio");
  return c;
}

/** Para Server Actions: mesmas checagens, mas lançando erro em vez de redirecionar. */
export async function actionUser() {
  const c = await getCurrent();
  if (!c) throw new Error("Faça login novamente.");
  return c;
}

export async function actionAdmin() {
  const c = await actionUser();
  if (!c.isAdmin) throw new Error("Apenas administradores.");
  return c;
}
