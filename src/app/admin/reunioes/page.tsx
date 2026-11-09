import Link from "next/link";
import { getStore } from "@/lib/store";
import { requireAdmin } from "@/lib/session";
import { Pager } from "@/components/Pager";
import { formatDateLong, timeSP } from "@/lib/time";
import { meetingWindow } from "@/lib/rules";

export const dynamic = "force-dynamic";
const PER_PAGE = 20;

export default async function Reunioes({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; todas?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const all = sp.todas === "1";
  const page = Math.max(1, Number(sp.page) || 1);
  const store = await getStore();
  const cycle = await store.currentCycle();
  const { rows, total } = await store.listMeetings({ cycleId: all ? undefined : cycle.id, q, limit: PER_PAGE, offset: (page - 1) * PER_PAGE });
  const now = new Date();
  const qs = (p: number) => `/admin/reunioes?${new URLSearchParams({ ...(q ? { q } : {}), ...(all ? { todas: "1" } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-4xl">Reuniões</h1>
          <p className="text-sm text-muted">
            {total} {all ? "no total" : `em ${cycle.name}`} ·{" "}
            <Link className="underline" href={all ? "/admin/reunioes" : "/admin/reunioes?todas=1"}>
              {all ? "ver só o ciclo atual" : "ver todos os ciclos"}
            </Link>
          </p>
        </div>
        <Link href="/admin/reunioes/nova" className="btn btn-primary">+ Nova reunião</Link>
      </div>
      <form className="flex gap-2" action="/admin/reunioes">
        {all && <input type="hidden" name="todas" value="1" />}
        <input className="input" name="q" defaultValue={q} placeholder="Buscar por tema" aria-label="Buscar reunião" />
        <button className="btn btn-primary">Buscar</button>
      </form>
      <ul className="card divide-y divide-line overflow-hidden">
        {rows.length === 0 && <li className="p-4 text-sm text-muted">Nenhuma reunião encontrada.</li>}
        {rows.map((m) => {
          const w = meetingWindow(m, now);
          return (
            <li key={m.id}>
              <Link href={`/admin/reunioes/${m.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-soft">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{m.theme}</p>
                  <p className="text-xs text-muted">
                    {formatDateLong(m.date)} · {timeSP(m.startsAt)}
                    {m.placeName ? ` · ${m.placeName}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.cycleId === cycle.id && w === "open" && m.isVisible && <span className="badge badge-ok">Presença aberta</span>}
                    {!m.isVisible && <span className="badge badge-muted">Oculta</span>}
                    {m.noLocationCount > 0 && <span className="badge badge-warn">{m.noLocationCount} sem localização</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="display text-2xl text-laranja">{m.presenceCount}</p>
                  <p className="text-xs text-muted">presentes</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <Pager page={page} pages={Math.max(1, Math.ceil(total / PER_PAGE))} href={qs} />
    </div>
  );
}
