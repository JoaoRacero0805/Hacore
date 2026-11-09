import { redirect } from "next/navigation";
import { getCurrent } from "@/lib/session";
import { ProfileFields } from "@/components/ProfileFields";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Monogram } from "@/components/Logo";
import { saveProfile } from "../actions";

export default async function Welcome() {
  const current = await getCurrent();
  if (!current) redirect("/");
  if (current.user.onboarded) redirect("/inicio");
  const { user } = current;
  return (
    <main className="min-h-dvh px-4 py-10 flex justify-center">
      <div className="w-full max-w-md">
        <Monogram size={48} />
        <h1 className="display text-4xl mt-4">Bem-vindo!</h1>
        <p className="text-muted mt-2">Confirme seus dados para começar. Leva 10 segundos.</p>
        <ActionForm action={saveProfile} className="card p-5 mt-6 flex flex-col gap-4">
          <input type="hidden" name="first" value="1" />
          <ProfileFields user={user} />
          <SubmitButton>Continuar</SubmitButton>
        </ActionForm>
      </div>
    </main>
  );
}
