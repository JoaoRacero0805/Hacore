import Link from "next/link";
import { getStore } from "@/lib/store";
import { requireAdmin } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { MeetingFields } from "@/components/MeetingFields";
import { nextSaturdaySP } from "@/lib/time";
import { createMeeting } from "../../actions";

export default async function NovaReuniao() {
  await requireAdmin();
  const places = await (await getStore()).listPlaces();
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Link href="/admin/reunioes" className="text-sm text-muted">← Reuniões</Link>
      <h1 className="display text-4xl">Nova reunião</h1>
      <ActionForm action={createMeeting} className="card p-5 flex flex-col gap-4">
        <MeetingFields places={places} defaultDate={nextSaturdaySP()} />
        <SubmitButton>Criar reunião</SubmitButton>
      </ActionForm>
    </div>
  );
}
