"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { actionAdmin } from "@/lib/session";
import { envAdmins } from "@/lib/config";
import { getStore } from "@/lib/store";
import { run, type ActionState } from "@/lib/action-state";
import { bool, campYear, date, email, optionalDate, optionalNumber, optionalUrl, required, str, time } from "@/lib/validate";
import { spInstant } from "@/lib/time";
import type { MeetingInput } from "@/lib/store/types";

const refresh = () => revalidatePath("/", "layout");

// ---------- Reuniões ----------

function meetingInput(fd: FormData): MeetingInput {
  const d = date(fd, "date", "data da reunião");
  const start = time(fd, "startTime", "início");
  const close = time(fd, "closeTime", "fim da presença");
  if (close <= start) throw new Error("O fim da presença precisa ser depois do início.");
  const placeId = str(fd, "placeId", 100) || null;
  return {
    theme: required(fd, "theme", "tema", 120),
    description: str(fd, "description", 2000),
    date: d,
    startsAt: spInstant(d, start),
    closesAt: spInstant(d, close),
    placeId,
    isVisible: bool(fd, "isVisible"),
    password: required(fd, "password", "senha da reunião", 60),
  };
}

export async function createMeeting(_: ActionState, fd: FormData): Promise<ActionState> {
  let id = "";
  const r = await run(async () => {
    const { user } = await actionAdmin();
    const store = await getStore();
    id = await store.createMeeting(meetingInput(fd), (await store.currentCycle()).id, user.email);
    refresh();
  });
  if (r.ok) redirect(`/admin/reunioes/${id}`);
  return r;
}

export async function updateMeeting(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    await actionAdmin();
    await (await getStore()).updateMeeting(required(fd, "id", "id"), meetingInput(fd));
    refresh();
    return "Reunião salva.";
  });
}

export async function deleteMeeting(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = await run(async () => {
    await actionAdmin();
    if (str(fd, "confirm") !== "EXCLUIR") throw new Error('Digite EXCLUIR para confirmar.');
    await (await getStore()).deleteMeeting(required(fd, "id", "id"));
    refresh();
  });
  if (r.ok) redirect("/admin/reunioes");
  return r;
}

// ---------- Presenças (edição pelo admin) ----------

export async function adminAddPresence(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const { user } = await actionAdmin();
    const created = await (await getStore()).addPresence({
      meetingId: required(fd, "meetingId", "reunião"),
      userId: required(fd, "userId", "campista"),
      source: "admin",
      location: "ok",
      markedBy: user.email,
    });
    refresh();
    return created ? "Presença adicionada." : "Essa pessoa já estava presente.";
  });
}

export async function adminRemovePresence(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    await actionAdmin();
    await (await getStore()).removePresence(required(fd, "meetingId", "reunião"), required(fd, "userId", "campista"));
    refresh();
    return "Presença removida.";
  });
}

/** Marca/desmarca presença de um campista numa reunião (tela do campista no painel). */
export async function togglePresence(fd: FormData) {
  const { user } = await actionAdmin();
  const store = await getStore();
  const meetingId = String(fd.get("meetingId"));
  const userId = String(fd.get("userId"));
  if (fd.get("present") === "1") await store.removePresence(meetingId, userId);
  else await store.addPresence({ meetingId, userId, source: "admin", location: "ok", markedBy: user.email });
  refresh();
}

export async function adminUpdateProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    await actionAdmin();
    await (await getStore()).updateProfile(required(fd, "id", "id"), { name: required(fd, "name", "nome", 100), ...campYear(fd) });
    refresh();
    return "Cadastro salvo.";
  });
}

// ---------- Locais ----------

function placeInput(fd: FormData) {
  const lat = optionalNumber(fd, "lat", -90, 90);
  const lng = optionalNumber(fd, "lng", -180, 180);
  if ((lat == null) !== (lng == null)) throw new Error("Informe latitude e longitude juntas.");
  return {
    name: required(fd, "name", "nome do local", 100),
    address: str(fd, "address", 200),
    lat,
    lng,
    radiusM: optionalNumber(fd, "radiusM", 20, 5000) ?? 150,
  };
}

export async function savePlace(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    await actionAdmin();
    const store = await getStore();
    const id = str(fd, "id", 100);
    if (id) await store.updatePlace(id, placeInput(fd));
    else await store.createPlace(placeInput(fd));
    refresh();
    return "Local salvo.";
  });
}

export async function setDefaultPlace(fd: FormData) {
  await actionAdmin();
  await (await getStore()).setDefaultPlace(String(fd.get("id")));
  refresh();
}

export async function deletePlace(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    await actionAdmin();
    const store = await getStore();
    const p = await store.getPlace(required(fd, "id", "id"));
    if (p?.isDefault) throw new Error("Escolha outro local padrão antes de excluir este.");
    await store.deletePlace(required(fd, "id", "id"));
    refresh();
    return "Local excluído.";
  });
}

// ---------- Mural ----------

function noticeInput(fd: FormData) {
  return {
    title: required(fd, "title", "título", 120),
    body: str(fd, "body", 4000),
    linkUrl: optionalUrl(fd, "linkUrl"),
    pinned: bool(fd, "pinned"),
    expiresOn: optionalDate(fd, "expiresOn"),
  };
}

export async function saveNotice(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id", 100);
  const r = await run(async () => {
    const { user } = await actionAdmin();
    const store = await getStore();
    if (id) await store.updateNotice(id, noticeInput(fd));
    else await store.createNotice(noticeInput(fd), user.email);
    refresh();
    return id ? "Aviso salvo." : "Aviso publicado.";
  });
  if (r.ok && id) redirect("/admin/mural");
  return r;
}

export async function deleteNotice(fd: FormData) {
  await actionAdmin();
  await (await getStore()).deleteNotice(String(fd.get("id")));
  refresh();
}

// ---------- Admins e ciclos ----------

export async function addAdmin(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const { user } = await actionAdmin();
    await (await getStore()).addAdmin(email(str(fd, "email", 200)), user.email);
    refresh();
    return "Admin adicionado.";
  });
}

export async function removeAdmin(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const { user } = await actionAdmin();
    const e = email(str(fd, "email", 200));
    if (e === user.email) throw new Error("Você não pode remover a si mesmo.");
    if (envAdmins().includes(e)) throw new Error("Este admin é fixo (configurado na Vercel).");
    await (await getStore()).removeAdmin(e);
    refresh();
    return "Admin removido.";
  });
}

export async function startNewCycle(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    await actionAdmin();
    if (str(fd, "confirm") !== "ZERAR") throw new Error("Digite ZERAR para confirmar.");
    const c = await (await getStore()).startNewCycle(required(fd, "name", "nome do novo ciclo", 80));
    refresh();
    return `Presenças zeradas. Novo ciclo: ${c.name}. O histórico anterior continua disponível para exportar.`;
  });
}
