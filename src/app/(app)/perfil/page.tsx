import { requireUser } from "@/lib/session";
import { getStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { ProfileFields } from "@/components/ProfileFields";
import { formatDateLong } from "@/lib/time";
import { logout, saveProfile } from "../../actions";

export const dynamic = "force-dynamic";

export default async function Perfil() {
  const { user, isAdmin } = await requireUser();
  const store = await getStore();
  const cycle = await store.currentCycle();
  const stats = await store.userStats(user.id, cycle.id);

  const info: [string, string][] = [
    ["Email", user.email],
    ["Total de presenças", String(stats.total)],
    ["Última presença", stats.lastPresence ? formatDateLong(stats.lastPresence) : "Nenhuma ainda"],
    ["Contando desde", formatDateLong(cycle.startedAt)],
    ["Conta criada em", formatDateLong(user.createdAt)],
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} src={user.photoUrl} size={64} />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">{user.name}</h1>
          <p className="text-sm text-muted">{isAdmin ? "Coordenação" : "Campista"}</p>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="display text-2xl">Seus dados</h2>
        <ActionForm action={saveProfile} className="card p-5 flex flex-col gap-4">
          <ProfileFields user={user} showEmail={false} />
          <SubmitButton>Salvar</SubmitButton>
        </ActionForm>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="display text-2xl">Sua caminhada</h2>
        <dl className="card divide-y divide-line">
          {info.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 px-4 py-3">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="font-semibold text-right break-all">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted">
          O email e a foto vêm da sua conta Google. As presenças são registradas na reunião e só a coordenação pode corrigir.
        </p>
      </section>

      <form action={logout}>
        <button className="btn btn-danger w-full">Sair</button>
      </form>
    </div>
  );
}
