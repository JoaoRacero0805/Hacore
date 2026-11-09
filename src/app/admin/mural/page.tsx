import Link from "next/link";
import { getStore } from "@/lib/store";
import { requireAdmin } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { formatDateLong, todaySP } from "@/lib/time";
import type { Notice } from "@/lib/store/types";
import { deleteNotice, saveNotice } from "../actions";

export const dynamic = "force-dynamic";

function NoticeForm({ n }: { n?: Notice }) {
  return (
    <ActionForm action={saveNotice} className="flex flex-col gap-3" resetOnSuccess={!n}>
      {n && <input type="hidden" name="id" value={n.id} />}
      <label className="field">
        <span>Título</span>
        <input className="input" name="title" required maxLength={120} defaultValue={n?.title} />
      </label>
      <label className="field">
        <span>Texto</span>
        <textarea className="input min-h-28" name="body" maxLength={4000} defaultValue={n?.body} />
      </label>
      <label className="field">
        <span>Link (opcional)</span>
        <input className="input" name="linkUrl" inputMode="url" defaultValue={n?.linkUrl ?? ""} placeholder="https://…" />
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <label className="field">
          <span>Sai do mural depois de (opcional)</span>
          <input className="input" type="date" name="expiresOn" defaultValue={n?.expiresOn ?? ""} />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium pb-3">
          <input type="checkbox" name="pinned" defaultChecked={n?.pinned} className="size-4 accent-[var(--laranja)]" />
          Fixar no topo
        </label>
      </div>
      <SubmitButton>{n ? "Salvar aviso" : "Publicar aviso"}</SubmitButton>
    </ActionForm>
  );
}

export default async function MuralAdmin({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  await requireAdmin();
  const { editar } = await searchParams;
  const notices = await (await getStore()).listNotices({});
  const today = todaySP();
  const editing = notices.find((n) => n.id === editar);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr] items-start">
      <section className="card p-5 flex flex-col gap-3">
        <h1 className="display text-3xl">{editing ? "Editar aviso" : "Novo aviso"}</h1>
        <NoticeForm key={editing?.id ?? "novo"} n={editing} />
        {editing && <Link href="/admin/mural" className="btn btn-ghost">Cancelar edição</Link>}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="display text-3xl">Avisos</h2>
        {notices.length === 0 && <p className="text-muted text-sm">Nenhum aviso publicado.</p>}
        {notices.map((n) => {
          const expired = n.expiresOn != null && n.expiresOn < today;
          return (
            <article key={n.id} className={`card p-4 ${expired ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold">{n.title}</h3>
                <div className="flex gap-1 shrink-0">
                  {n.pinned && <span className="badge badge-orange">Fixado</span>}
                  {expired && <span className="badge badge-muted">Expirado</span>}
                </div>
              </div>
              {n.body && <p className="text-sm mt-1 line-clamp-3 whitespace-pre-line">{n.body}</p>}
              <p className="text-xs text-muted mt-2">
                {formatDateLong(n.createdAt)} · {n.createdBy.split("@")[0]}
                {n.expiresOn && ` · sai em ${formatDateLong(n.expiresOn)}`}
              </p>
              <div className="flex gap-2 mt-3">
                <Link href={`/admin/mural?editar=${n.id}`} className="btn btn-secondary text-sm">Editar</Link>
                <form action={deleteNotice}>
                  <input type="hidden" name="id" value={n.id} />
                  <button className="btn btn-danger text-sm">Apagar</button>
                </form>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
