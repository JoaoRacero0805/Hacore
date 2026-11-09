"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signIn, signOut } from "@/lib/auth";
import { isDemo } from "@/lib/config";
import { selfCheckIn, type CheckInResult } from "@/lib/rules";
import { actionUser, DEMO_COOKIE } from "@/lib/session";
import { getStore } from "@/lib/store";
import { run, type ActionState } from "@/lib/action-state";
import { campYear, required } from "@/lib/validate";

export async function googleSignIn() {
  await signIn("google", { redirectTo: "/" });
}

export async function demoSignIn(formData: FormData) {
  if (!isDemo()) throw new Error("Indisponível.");
  const email = String(formData.get("email") ?? "");
  (await cookies()).set(DEMO_COOKIE, email, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/");
}

export async function logout() {
  if (isDemo()) {
    (await cookies()).delete(DEMO_COOKIE);
    redirect("/");
  }
  await signOut({ redirectTo: "/" });
}

type Pos = { lat: number; lng: number; accuracy?: number } | null;

export async function checkIn(meetingId: string, position: Pos): Promise<CheckInResult | { ok: false; reason: "error"; message: string }> {
  try {
    const { user } = await actionUser();
    const p =
      position && typeof position.lat === "number" && typeof position.lng === "number"
        ? { lat: position.lat, lng: position.lng, accuracy: typeof position.accuracy === "number" ? position.accuracy : undefined }
        : null;
    const r = await selfCheckIn(await getStore(), { userId: user.id, meetingId: String(meetingId), position: p });
    if (r.ok) revalidatePath("/inicio");
    return r;
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : "Erro" };
  }
}

export async function saveProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const first = fd.get("first") === "1";
  const res = await run(async () => {
    const { user } = await actionUser();
    const name = required(fd, "name", "nome", 100);
    await (await getStore()).updateProfile(user.id, { name, ...campYear(fd) });
    revalidatePath("/", "layout");
    return "Perfil salvo.";
  });
  if (res.ok && first) redirect("/inicio");
  return res;
}
