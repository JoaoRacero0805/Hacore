import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { requireAdmin } from "@/lib/session";
import { Avatar } from "@/components/Avatar";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { ProfileFields } from "@/components/ProfileFields";
import { formatDateLong } from "@/lib/time";
import { adminUpdateProfile, togglePresence } from "../../actions";

export const dynamic = "force-dynamic";

export default async function Jovem({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const store = await getStore();
  const user = await store.getUser(id);
  if (!user) notFound();
  const cycle = await store.currentCycle();
  const meetings = await store.userMeetings(user.id, cycle.id, false);
  const total = meetings.filter((m) => m.present).length;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin" className="text-sm text-muted">← Jovens</Link>
      <div className="flex items-center gap-4">
        <Avatar name={user.name} src={user.photoUrl} size={60} />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">{user.name}</h1>
          <p className="text-sm text-muted truncate">{user.email}</p>
          <p className="text-sm mt-1">
            <b className="text-laranja">{total}</b> presença{total === 1 ? "" : "s"} em {cycle.name}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_1.3fr] items-start">
        <ActionForm action={adminUpdateProfile} className="card p-5 flex flex-col gap-4">
          <h2 className="font-bold">Cadastro</h2>
          <input type="hidden" name="id" value={user.id} />
          <ProfileFields user={user} />
          <SubmitButton>Salvar cadastro</SubmitButton>
        </ActionForm>

        <section className="card overflow-hidden">
          <div className="px-4 py-3 bg-soft">
            <h2 className="font-bold">Presenças no ciclo</h2>
            <p className="text-xs text-muted">Toque para marcar ou desmarcar. O total é calculado sozinho.</p>
          </div>
          {meetings.length === 0 && <p className="p-4 text-sm text-muted">Nenhuma reunião neste ciclo.</p>}
          <ul className="divide-y divide-line">
            {meetings.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="font-medium truncate">{m.theme}</p>
                  <p className="text-xs text-muted">
                    {formatDateLong(m.date)}
                    {m.present && m.location === "none" && <span className="badge badge-warn ml-2">sem localização</span>}
                    {m.present && m.source === "admin" && <span className="badge badge-muted ml-2">marcada por admin</span>}
                  </p>
                </div>
                <form action={togglePresence}>
                  <input type="hidden" name="meetingId" value={m.id} />
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="present" value={m.present ? "1" : "0"} />
                  <button className={`btn text-sm ${m.present ? "bg-ok-bg text-ok" : "btn-secondary"}`} aria-label={`${m.present ? "Desmarcar" : "Marcar"} presença em ${m.theme}`}>
                    {m.present ? "✓ Presente" : "Faltou"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
