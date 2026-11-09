import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";
import { createPostgresStore } from "@/lib/store/postgres";
import type { Store } from "@/lib/store/types";
import { selfCheckIn } from "@/lib/rules";
import { spInstant } from "@/lib/time";

const schema = readFileSync("db/schema.sql", "utf8");

async function makeStore(): Promise<Store> {
  const db = new PGlite({ extensions: { unaccent } });
  await db.exec(schema);
  return createPostgresStore(async (t, p) => (await db.query(t, p)).rows as Record<string, unknown>[]);
}

const HALLEL = { lat: -20.5386, lng: -47.4009 };
// ~50 m ao norte e ~1 km ao norte do ponto
const NEAR = { lat: HALLEL.lat + 0.00045, lng: HALLEL.lng, accuracy: 10 };
const FAR = { lat: HALLEL.lat + 0.009, lng: HALLEL.lng, accuracy: 10 };

const DATE = "2026-11-07"; // no passado (o "zerar" só move reuniões futuras)
const DURING = spInstant(DATE, "17:00");

let store: Store;
let meetingId: string;
let userId: string;

beforeEach(async () => {
  store = await makeStore();
  await store.updatePlace("escola-hallel", { name: "Escola Hallel", address: "", lat: HALLEL.lat, lng: HALLEL.lng, radiusM: 150 });
  const cycle = await store.currentCycle();
  meetingId = await store.createMeeting(
    { theme: "Teste", description: "", date: DATE, startsAt: spInstant(DATE, "16:30"), closesAt: spInstant(DATE, "23:59"), placeId: "escola-hallel", isVisible: true },
    cycle.id,
    "admin@x.com",
  );
  userId = (await store.upsertUserFromLogin({ email: "Campista@Gmail.com", name: "João", photoUrl: null })).id;
});

describe("schema", () => {
  it("é idempotente", async () => {
    const db = new PGlite({ extensions: { unaccent } });
    await db.exec(schema);
    await db.exec(schema);
    const r = await db.query<{ c: number }>("select count(*)::int as c from places");
    expect(r.rows[0].c).toBe(1);
  });
});

describe("presença do campista", () => {
  it("marca com localização dentro do raio", async () => {
    const r = await selfCheckIn(store, { userId, meetingId, position: NEAR, now: DURING });
    expect(r).toMatchObject({ ok: true, location: "ok" });
    const list = await store.meetingPresences(meetingId);
    expect(list).toHaveLength(1);
    expect(list[0].location).toBe("ok");
  });

  it("recusa quem está longe e não grava nada", async () => {
    const r = await selfCheckIn(store, { userId, meetingId, position: FAR, now: DURING });
    expect(r).toMatchObject({ ok: false, reason: "far" });
    expect(await store.meetingPresences(meetingId)).toHaveLength(0);
  });

  it("sem localização registra com a etiqueta para revisão", async () => {
    const r = await selfCheckIn(store, { userId, meetingId, position: null, now: DURING });
    expect(r).toMatchObject({ ok: true, location: "none" });
    expect(await store.meetingPresences(meetingId, { onlyNoLocation: true })).toHaveLength(1);
  });

  it("respeita a janela: antes do início e depois das 23:59", async () => {
    expect(await selfCheckIn(store, { userId, meetingId, position: NEAR, now: spInstant(DATE, "16:00") })).toMatchObject({ reason: "not_yet" });
    expect(await selfCheckIn(store, { userId, meetingId, position: NEAR, now: spInstant("2026-11-08", "00:01") })).toMatchObject({ reason: "closed" });
    expect(await selfCheckIn(store, { userId, meetingId, position: NEAR, now: spInstant(DATE, "23:30") })).toMatchObject({ ok: true });
  });

  it("não duplica presença", async () => {
    await selfCheckIn(store, { userId, meetingId, position: NEAR, now: DURING });
    expect(await selfCheckIn(store, { userId, meetingId, position: NEAR, now: DURING })).toMatchObject({ ok: false, reason: "already" });
  });

  it("reunião escondida não aceita presença", async () => {
    const m = (await store.getMeeting(meetingId))!;
    await store.updateMeeting(meetingId, { ...m, isVisible: false });
    expect(await selfCheckIn(store, { userId, meetingId, position: NEAR, now: DURING })).toMatchObject({ reason: "not_found" });
  });

  it("aparece em reuniões abertas só dentro da janela", async () => {
    expect(await store.openMeetings(DURING)).toHaveLength(1);
    expect(await store.openMeetings(spInstant(DATE, "12:00"))).toHaveLength(0);
  });
});

describe("ciclos (zerar presenças)", () => {
  it("zera a contagem mas guarda o histórico", async () => {
    await selfCheckIn(store, { userId, meetingId, position: NEAR, now: DURING });
    const old = await store.currentCycle();
    expect((await store.userStats(userId, old.id)).total).toBe(1);

    const next = await store.startNewCycle("Pós-Hacoré 2026");
    expect(next.id).not.toBe(old.id);
    expect((await store.currentCycle()).id).toBe(next.id);
    expect((await store.userStats(userId, next.id)).total).toBe(0);
    // histórico continua lá
    expect((await store.userStats(userId, old.id)).total).toBe(1);
    expect(await store.listCycles()).toHaveLength(2);
    // reunião do ciclo antigo não aceita mais presença
    const other = (await store.upsertUserFromLogin({ email: "b@x.com", name: "B", photoUrl: null })).id;
    expect(await selfCheckIn(store, { userId: other, meetingId, position: NEAR, now: DURING })).toMatchObject({ reason: "closed" });
  });

  it("reuniões futuras passam para o ciclo novo", async () => {
    const old = await store.currentCycle();
    const future = new Date(Date.now() + 7 * 86400000);
    const fid = await store.createMeeting(
      { theme: "Futura", description: "", date: "2099-01-01", startsAt: future, closesAt: new Date(future.getTime() + 3600000), placeId: null, isVisible: true },
      old.id,
      "a",
    );
    const next = await store.startNewCycle("Novo");
    expect((await store.getMeeting(fid))!.cycleId).toBe(next.id);
    expect((await store.getMeeting(meetingId))!.cycleId).toBe(old.id);
  });
});

describe("admin", () => {
  it("edita presença por reunião e o total é calculado", async () => {
    const cycle = await store.currentCycle();
    await store.addPresence({ meetingId, userId, source: "admin", location: "ok", markedBy: "admin@x.com" });
    let list = await store.listUsers({ cycleId: cycle.id, limit: 10, offset: 0 });
    expect(list.rows[0]).toMatchObject({ total: 1, lastPresence: DATE });
    await store.removePresence(meetingId, userId);
    list = await store.listUsers({ cycleId: cycle.id, limit: 10, offset: 0 });
    expect(list.rows[0].total).toBe(0);
  });

  it("busca sem acento e ordena por presenças", async () => {
    const cycle = await store.currentCycle();
    const ana = (await store.upsertUserFromLogin({ email: "ana@x.com", name: "Ana Júlia", photoUrl: null })).id;
    await store.addPresence({ meetingId, userId: ana, source: "self", location: "ok", markedBy: null });
    const r = await store.listUsers({ cycleId: cycle.id, q: "julia", limit: 10, offset: 0 });
    expect(r.rows.map((u) => u.name)).toEqual(["Ana Júlia"]);
    const sorted = await store.listUsers({ cycleId: cycle.id, sort: "total", desc: true, limit: 10, offset: 0 });
    expect(sorted.rows[0].name).toBe("Ana Júlia");
    expect(sorted.total).toBe(2);
    const page2 = await store.listUsers({ cycleId: cycle.id, limit: 10, offset: 10 });
    expect(page2).toEqual({ rows: [], total: 2 });
  });

  it("email é salvo em minúsculo e login repetido não duplica", async () => {
    const again = await store.upsertUserFromLogin({ email: "campista@gmail.com", name: "Outro nome", photoUrl: "https://x/y.png" });
    expect(again.id).toBe(userId);
    expect(again.name).toBe("João");
    expect(again.photoUrl).toBe("https://x/y.png");
  });

  it("admins: adicionar e remover", async () => {
    await store.addAdmin("Coord@Gmail.com", "x");
    await store.addAdmin("coord@gmail.com", "x");
    expect(await store.isAdminInDb("coord@gmail.com")).toBe(true);
    expect(await store.listAdmins()).toHaveLength(1);
    await store.removeAdmin("coord@gmail.com");
    expect(await store.isAdminInDb("coord@gmail.com")).toBe(false);
  });

  it("mural: avisos expirados somem e fixados vêm primeiro", async () => {
    await store.createNotice({ title: "Velho", body: "", linkUrl: null, pinned: false, expiresOn: "2026-01-01" }, "a");
    await store.createNotice({ title: "Normal", body: "", linkUrl: null, pinned: false, expiresOn: null }, "a");
    await store.createNotice({ title: "Fixado", body: "", linkUrl: null, pinned: true, expiresOn: "2026-12-31" }, "a");
    const active = await store.listNotices({ activeOn: "2026-11-09" });
    expect(active.map((n) => n.title)).toEqual(["Fixado", "Normal"]);
    expect(await store.listNotices({})).toHaveLength(3);
  });

  it("locais: o primeiro criado vira padrão e dá para trocar", async () => {
    const id = await store.createPlace({ name: "Paróquia", address: "", lat: null, lng: null, radiusM: 200 });
    expect((await store.getPlace(id))!.isDefault).toBe(false);
    await store.setDefaultPlace(id);
    const places = await store.listPlaces();
    expect(places.filter((p) => p.isDefault).map((p) => p.id)).toEqual([id]);
  });

  it("relatório do ciclo", async () => {
    await selfCheckIn(store, { userId, meetingId, position: null, now: DURING });
    const rep = await store.cycleReport((await store.currentCycle()).id);
    expect(rep.meetings).toHaveLength(1);
    expect(rep.presences).toEqual([{ meetingId, userId, location: "none" }]);
    expect(rep.users[0].total).toBe(1);
  });

  it("lista de reuniões com contagens e busca", async () => {
    await selfCheckIn(store, { userId, meetingId, position: null, now: DURING });
    const r = await store.listMeetings({ q: "tes", limit: 8, offset: 0 });
    expect(r.total).toBe(1);
    expect(r.rows[0]).toMatchObject({ presenceCount: 1, noLocationCount: 1, placeName: "Escola Hallel", date: DATE });
    const um = await store.userMeetings(userId, (await store.currentCycle()).id, true);
    expect(um[0]).toMatchObject({ present: true, location: "none", source: "self" });
  });
});
