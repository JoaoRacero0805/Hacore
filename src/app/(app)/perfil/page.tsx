import { requireUser } from "@/lib/session";
import { Avatar } from "@/components/Avatar";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { ProfileFields } from "@/components/ProfileFields";
import { logout, saveProfile } from "../../actions";

export default async function Perfil() {
  const { user } = await requireUser();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} src={user.photoUrl} size={64} />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">{user.name}</h1>
          <p className="text-sm text-muted truncate">{user.email}</p>
        </div>
      </div>
      <ActionForm action={saveProfile} className="card p-5 flex flex-col gap-4">
        <ProfileFields user={user} />
        <SubmitButton>Salvar</SubmitButton>
      </ActionForm>
      <p className="text-xs text-muted">A foto vem da sua conta Google. Para trocar, mude a foto no Google.</p>
      <form action={logout}>
        <button className="btn btn-danger w-full">Sair</button>
      </form>
    </div>
  );
}
