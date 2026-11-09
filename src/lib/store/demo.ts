import type { Store } from "./types";
import { nextSaturdaySP, spInstant, todaySP } from "../time";

/** Dados de demonstração (só no modo sem banco real). */
export async function seedDemo(store: Store) {
  // Ponto de exemplo para a demonstração. No app real, o admin marca o ponto no painel.
  await store.updatePlace("escola-hallel", {
    name: "Escola Hallel",
    address: "Av. Vereador José Granzotte, 2379 - Franca/SP",
    lat: -20.5386,
    lng: -47.4009,
    radiusM: 150,
  });
  const cycle = await store.currentCycle();
  const names = ["Ana Clara Souza", "Bruno Henrique Lima", "Carolina Mendes", "Davi Rocha", "Eduarda Martins", "Felipe Andrade"];
  const users = [];
  for (const [i, name] of names.entries()) {
    const u = await store.upsertUserFromLogin({ email: `campista${i + 1}@exemplo.com`, name, photoUrl: null });
    await store.updateProfile(u.id, { name, madeCamp: i % 2 === 0, campYear: i % 2 === 0 ? 2025 : null });
    users.push(u);
  }
  const today = todaySP();
  const sat = nextSaturdaySP();
  const past = ["2026-10-17", "2026-10-24", "2026-10-31"].filter((x) => x < today);
  const themes = ["Vaidade", "Dons do Espírito Santo", "Sagrado Coração"];
  for (const [i, date] of past.entries()) {
    const id = await store.createMeeting(
      { theme: themes[i], description: "", date, startsAt: spInstant(date, "16:30"), closesAt: spInstant(date, "23:59"), placeId: "escola-hallel", isVisible: true },
      cycle.id,
      "demo",
    );
    for (const [j, u] of users.entries()) {
      if ((i + j) % 3 !== 0) await store.addPresence({ meetingId: id, userId: u.id, source: "self", location: j === 4 ? "none" : "ok", markedBy: null });
    }
  }
  // Uma reunião aberta agora, para testar o "Marcar presença" na demonstração.
  const now = new Date();
  await store.createMeeting(
    { theme: "Reunião de demonstração (aberta agora)", description: "Use para testar a presença.", date: today, startsAt: new Date(now.getTime() - 3600_000), closesAt: spInstant(today, "23:59") > now ? spInstant(today, "23:59") : new Date(now.getTime() + 3600_000), placeId: "escola-hallel", isVisible: true },
    cycle.id,
    "demo",
  );
  if (sat !== today) {
    await store.createMeeting(
      { theme: "Próxima reunião", description: "", date: sat, startsAt: spInstant(sat, "16:30"), closesAt: spInstant(sat, "23:59"), placeId: "escola-hallel", isVisible: true },
      cycle.id,
      "demo",
    );
  }
  await store.createNotice(
    { title: "Bem-vindo ao novo app de presenças!", body: "Agora a presença é marcada pelo app, no local da reunião, com a localização do celular.", linkUrl: null, pinned: true, expiresOn: null },
    "demo",
  );
  await store.createNotice(
    { title: "Pré-inscrições abertas", body: "As pré-inscrições para o próximo Hacoré estão abertas. Fale com a coordenação.", linkUrl: "https://www.instagram.com/acampamentohacore/", pinned: false, expiresOn: null },
    "demo",
  );
}
