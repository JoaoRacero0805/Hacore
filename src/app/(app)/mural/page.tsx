import { requireUser } from "@/lib/session";
import { getStore } from "@/lib/store";
import { NoticeCard } from "@/components/NoticeCard";
import { todaySP } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function Mural() {
  await requireUser();
  const notices = await (await getStore()).listNotices({ activeOn: todaySP() });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-4xl">Mural de avisos</h1>
      {notices.length === 0 ? <p className="text-muted">Nenhum aviso no momento.</p> : notices.map((n) => <NoticeCard key={n.id} n={n} />)}
    </div>
  );
}
