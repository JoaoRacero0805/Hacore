import Link from "next/link";
import { getStore } from "@/lib/store";
import { requireAdmin } from "@/lib/session";
import { Avatar } from "@/components/Avatar";
import { Pager } from "@/components/Pager";
import { formatDateShort } from "@/lib/time";
import type { UserSort } from "@/lib/store/types";

export const dynamic = "force-dynamic";
const PER_PAGE = 30;

type SP = Promise<{ q?: string; sort?: string; dir?: string; page?: string }>;

export default async function Jovens({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const sort: UserSort = sp.sort === "total" || sp.sort === "last" ? sp.sort : "name";
  const desc = sp.dir ? sp.dir === "desc" : sort !== "name";
  const page = Math.max(1, Number(sp.page) || 1);
  const store = await getStore();
  const cycle = await store.currentCycle();
  const { rows, total } = await store.listUsers({ q, sort, desc, limit: PER_PAGE, offset: (page - 1) * PER_PAGE, cycleId: cycle.id });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const link = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q, sort, dir: desc ? "desc" : "asc", page, ...over };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && !(k === "page" && v === 1)) p.set(k, String(v));
    return `/admin?${p}`;
  };
  const sortLink = (s: UserSort, label: string) => {
    const active = sort === s;
    const nextDir = active ? (desc ? "asc" : "desc") : s === "name" ? "asc" : "desc";
    return (
      <Link href={link({ sort: s, dir: nextDir, page: 1 })} className={active ? "text-laranja" : ""}>
        {label}
        {active ? (desc ? " ↓" : " ↑") : ""}
      </Link>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-4xl">Jovens</h1>
          <p className="text-sm text-muted">
            {total} {q ? "encontrados" : "cadastrados"} · presenças contadas em <b>{cycle.name}</b>
          </p>
        </div>
        <a href={`/admin/exportar?ciclo=${cycle.id}`} className="btn btn-secondary">
          Exportar Excel do ciclo
        </a>
      </div>

      <form className="flex gap-2" action="/admin">
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={desc ? "desc" : "asc"} />
        <input className="input" name="q" defaultValue={q} placeholder="Buscar por nome ou email" aria-label="Buscar jovem" />
        <button className="btn btn-primary">Buscar</button>
      </form>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted bg-soft">
          {sortLink("name", "Nome")}
          <span className="w-20 text-center">{sortLink("total", "Presenças")}</span>
          <span className="w-20 text-right">{sortLink("last", "Última")}</span>
        </div>
        {rows.length === 0 && <p className="p-4 text-muted text-sm">Nenhum jovem encontrado.</p>}
        <ul className="divide-y divide-line">
          {rows.map((u) => (
            <li key={u.id}>
              <Link href={`/admin/jovens/${u.id}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-2.5 hover:bg-soft">
                <span className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.name} src={u.photoUrl} size={34} />
                  <span className="min-w-0">
                    <span className="block font-medium truncate">{u.name}</span>
                    <span className="block text-xs text-muted truncate">{u.email}</span>
                  </span>
                </span>
                <span className="w-20 text-center font-bold">{u.total}</span>
                <span className="w-20 text-right text-sm text-muted">{u.lastPresence ? formatDateShort(u.lastPresence) : "—"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Pager page={page} pages={pages} href={(p) => link({ page: p })} />
    </div>
  );
}
