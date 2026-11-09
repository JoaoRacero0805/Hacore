import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { requireAdmin } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { MeetingFields } from "@/components/MeetingFields";
import { Avatar } from "@/components/Avatar";
import { formatDateLong, formatDateTime, todaySP } from "@/lib/time";
import { meetingWindow } from "@/lib/rules";
import { adminAddPresence, adminRemovePresence, deleteMeeting, updateMeeting } from "../../actions";

export const dynamic = "force-dynamic";

type SP = Promise<{ filtro?: string; q?: string; add?: string }>;

export default async function Reuniao({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const store = await getStore();
  const meeting = await store.getMeeting(id);
  if (!meeting) notFound();
  const onlyNoLocation = sp.filtro === "sem-localizacao";
  const [places, presences, cycle] = await Promise.all([
    store.listPlaces(),
    store.meetingPresences(id, { onlyNoLocation, q: sp.q }),
    store.currentCycle(),
  ]);
  const addQ = sp.add?.trim() ?? "";
  const candidates = addQ ? await store.searchUsers(addQ, 8) : [];
  const presentIds = new Set((onlyNoLocation || sp.q ? await store.meetingPresences(id) : presences).map((p) => p.user.id));
  const w = meetingWindow(meeting, new Date());
  const status =
    meeting.cycleId !== cycle.id ? "De um ciclo anterior" : !meeting.isVisible ? "Oculta" : w === "open" ? "Presença aberta agora" : w === "not_yet" ? "Presença ainda não abriu" : "Presença encerrada";

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/reunioes" className="text-sm text-muted">← Reuniões</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-4xl break-words">{meeting.theme}</h1>
          <p className="text-sm text-muted mt-1">
            {formatDateLong(meeting.date)} · <span className={w === "open" ? "text-ok font-semibold" : ""}>{status}</span>
          </p>
        </div>
        <a href={`/admin/exportar?reuniao=${meeting.id}`} className="btn btn-secondary">Exportar Excel</a>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] items-start">
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-lg">
              {meeting.presenceCount} presente{meeting.presenceCount === 1 ? "" : "s"}
              {meeting.noLocationCount > 0 && <span className="badge badge-warn ml-2">{meeting.noLocationCount} sem localização</span>}
            </h2>
            <div className="flex gap-1 text-sm">
              <Link href={`/admin/reunioes/${id}`} className={`rounded-full px-3 py-1 font-semibold ${!onlyNoLocation ? "bg-laranja text-white" : "bg-soft"}`}>Todos</Link>
              <Link href={`/admin/reunioes/${id}?filtro=sem-localizacao`} className={`rounded-full px-3 py-1 font-semibold ${onlyNoLocation ? "bg-laranja text-white" : "bg-soft"}`}>Sem localização</Link>
            </div>
          </div>
          {onlyNoLocation && (
            <p className="text-sm text-muted">
              Presenças marcadas sem localização (GPS negado ou falhou). Confira se a pessoa estava na reunião e remova as que não estavam.
            </p>
          )}
          <form className="flex gap-2" action={`/admin/reunioes/${id}`}>
            {onlyNoLocation && <input type="hidden" name="filtro" value="sem-localizacao" />}
            <input className="input" name="q" defaultValue={sp.q} placeholder="Filtrar presentes por nome" aria-label="Filtrar presentes" />
            <button className="btn btn-secondary">Filtrar</button>
          </form>
          <ul className="card divide-y divide-line overflow-hidden">
            {presences.length === 0 && <li className="p-4 text-sm text-muted">Ninguém por aqui.</li>}
            {presences.map((p) => (
              <li key={p.user.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <Link href={`/admin/campistas/${p.user.id}`} className="flex items-center gap-3 min-w-0">
                  <Avatar name={p.user.name} src={p.user.photoUrl} size={34} />
                  <span className="min-w-0">
                    <span className="block font-medium truncate">{p.user.name}</span>
                    <span className="block text-xs text-muted">
                      {formatDateTime(p.createdAt)} · {p.totalInCycle} no ciclo
                      {p.location === "none" && <span className="badge badge-warn ml-1">sem localização</span>}
                      {p.source === "admin" && <span className="badge badge-muted ml-1">por {p.markedBy?.split("@")[0]}</span>}
                    </span>
                  </span>
                </Link>
                <ActionForm action={adminRemovePresence}>
                  <input type="hidden" name="meetingId" value={id} />
                  <input type="hidden" name="userId" value={p.user.id} />
                  <SubmitButton className="btn btn-danger text-sm" pendingText="…">Remover</SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-5">
          <section className="card p-5 flex flex-col gap-3">
            <h2 className="font-bold">Adicionar presença</h2>
            <p className="text-xs text-muted">Para quem estava na reunião mas não conseguiu marcar (sem celular, sem bateria…).</p>
            <form className="flex gap-2" action={`/admin/reunioes/${id}`}>
              <input className="input" name="add" defaultValue={addQ} placeholder="Nome do campista" aria-label="Buscar campista para adicionar" />
              <button className="btn btn-secondary">Buscar</button>
            </form>
            {addQ && candidates.length === 0 && <p className="text-sm text-muted">Ninguém encontrado. A pessoa precisa ter entrado no app pelo menos uma vez.</p>}
            <ul className="flex flex-col gap-2">
              {candidates.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{u.name}</span>
                  {presentIds.has(u.id) ? (
                    <span className="badge badge-ok">Presente</span>
                  ) : (
                  <ActionForm action={adminAddPresence}>
                    <input type="hidden" name="meetingId" value={id} />
                    <input type="hidden" name="userId" value={u.id} />
                    <SubmitButton className="btn btn-primary text-sm" pendingText="…">Adicionar</SubmitButton>
                  </ActionForm>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <details className="card p-5">
            <summary className="font-bold cursor-pointer">Editar reunião</summary>
            <ActionForm action={updateMeeting} className="mt-4 flex flex-col gap-4">
              <MeetingFields meeting={meeting} places={places} defaultDate={todaySP()} />
              <SubmitButton>Salvar</SubmitButton>
            </ActionForm>
          </details>

          <details className="card p-5">
            <summary className="font-bold cursor-pointer text-danger">Excluir reunião</summary>
            <ActionForm action={deleteMeeting} className="mt-3 flex flex-col gap-2">
              <input type="hidden" name="id" value={id} />
              <p className="text-sm text-muted">Apaga a reunião e todas as presenças dela. Digite EXCLUIR para confirmar.</p>
              <input className="input" name="confirm" autoComplete="off" aria-label="Confirmação" />
              <SubmitButton className="btn btn-danger">Excluir de vez</SubmitButton>
            </ActionForm>
          </details>
        </aside>
      </div>
    </div>
  );
}
