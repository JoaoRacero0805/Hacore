import ExcelJS from "exceljs";
import { getCurrent } from "@/lib/session";
import { getStore } from "@/lib/store";
import { formatDateLong, todaySP } from "@/lib/time";

export const dynamic = "force-dynamic";

function fileName(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w-]+/g, "-").replace(/-+/g, "-").slice(0, 60);
}

function styleHeader(ws: ExcelJS.Worksheet) {
  const row = ws.getRow(1);
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF7A00" } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

export async function GET(req: Request) {
  const c = await getCurrent();
  if (!c?.isAdmin) return new Response("Apenas administradores.", { status: 403 });
  const url = new URL(req.url);
  const store = await getStore();
  const wb = new ExcelJS.Workbook();
  let name: string;

  const meetingId = url.searchParams.get("reuniao");
  if (meetingId) {
    const m = await store.getMeeting(meetingId);
    if (!m) return new Response("Reunião não encontrada.", { status: 404 });
    const rows = await store.meetingPresences(m.id);
    const ws = wb.addWorksheet("Presenças");
    ws.columns = [
      { header: "Nome", key: "name", width: 36 },
      { header: "Email", key: "email", width: 34 },
      { header: "Fez o Hacoré", key: "camp", width: 14 },
      { header: "Marcada em", key: "at", width: 20 },
      { header: "Localização", key: "loc", width: 18 },
      { header: "Marcada por", key: "by", width: 28 },
      { header: "Presenças no ciclo", key: "total", width: 18 },
    ];
    for (const p of rows)
      ws.addRow({
        name: p.user.name,
        email: p.user.email,
        camp: p.user.madeCamp ? String(p.user.campYear ?? "Sim") : "Não",
        at: p.createdAt,
        loc: p.location === "ok" ? "Confirmada" : "Sem localização",
        by: p.source === "admin" ? p.markedBy : "Próprio jovem",
        total: p.totalInCycle,
      });
    ws.getColumn("at").numFmt = "dd/mm/yyyy hh:mm";
    styleHeader(ws);
    name = `presencas-${m.date}-${fileName(m.theme)}`;
  } else {
    const cycleId = url.searchParams.get("ciclo") ?? (await store.currentCycle()).id;
    const cycle = (await store.listCycles()).find((x) => x.id === cycleId);
    if (!cycle) return new Response("Ciclo não encontrado.", { status: 404 });
    const rep = await store.cycleReport(cycle.id);
    const present = new Map<string, "ok" | "none">();
    for (const p of rep.presences) present.set(`${p.userId}|${p.meetingId}`, p.location);

    const ws = wb.addWorksheet("Jovens");
    ws.columns = [
      { header: "Nome", key: "name", width: 36 },
      { header: "Email", key: "email", width: 34 },
      { header: "Fez o Hacoré", key: "camp", width: 14 },
      { header: "Presenças", key: "total", width: 12 },
      { header: "Última presença", key: "last", width: 22 },
      ...rep.meetings.map((m) => ({ header: `${m.date.slice(8, 10)}/${m.date.slice(5, 7)} ${m.theme}`, key: m.id, width: 14 })),
    ];
    for (const u of [...rep.users].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "pt-BR"))) {
      const row: Record<string, unknown> = {
        name: u.name,
        email: u.email,
        camp: u.madeCamp ? String(u.campYear ?? "Sim") : "Não",
        total: u.total,
        last: u.lastPresence ? formatDateLong(u.lastPresence) : "",
      };
      for (const m of rep.meetings) {
        const l = present.get(`${u.id}|${m.id}`);
        row[m.id] = l === "ok" ? "P" : l === "none" ? "P*" : "";
      }
      ws.addRow(row);
    }
    styleHeader(ws);
    ws.addRow([]);
    ws.addRow(["P = presente · P* = presente sem localização"]);

    const wm = wb.addWorksheet("Reuniões");
    wm.columns = [
      { header: "Data", key: "date", width: 14 },
      { header: "Tema", key: "theme", width: 40 },
      { header: "Local", key: "place", width: 24 },
      { header: "Presentes", key: "count", width: 12 },
      { header: "Sem localização", key: "none", width: 16 },
    ];
    for (const m of rep.meetings) wm.addRow({ date: m.date.split("-").reverse().join("/"), theme: m.theme, place: m.placeName ?? "", count: m.presenceCount, none: m.noLocationCount });
    styleHeader(wm);
    name = `hacore-${fileName(cycle.name)}-${todaySP()}`;
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
