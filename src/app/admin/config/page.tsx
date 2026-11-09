import { getStore } from "@/lib/store";
import { requireAdmin } from "@/lib/session";
import { envAdmins } from "@/lib/config";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { formatDateLong, todaySP } from "@/lib/time";
import { addAdmin, removeAdmin, startNewCycle } from "../actions";

export const dynamic = "force-dynamic";

export default async function Config() {
  const { user } = await requireAdmin();
  const store = await getStore();
  const [admins, cycles] = await Promise.all([store.listAdmins(), store.listCycles()]);
  const fixed = envAdmins();
  const current = cycles.find((c) => !c.endedAt)!;
  // Dois ciclos por ano: depois do acampamento de Corpus Christi (meio do ano) e depois do de novembro.
  const [y, mo] = todaySP().split("-").map(Number);
  const suggested = mo >= 5 && mo <= 10 ? `Pós-Corpus Christi ${y}` : `Pós-acampamento de novembro ${mo >= 11 ? y : y - 1}`;

  return (
    <div className="grid gap-5 lg:grid-cols-2 items-start">
      <section className="card p-5 flex flex-col gap-4">
        <h1 className="display text-3xl">Admins</h1>
        <p className="text-sm text-muted">Todos os admins têm os mesmos poderes. Eles entram com a própria conta Google.</p>
        <ul className="divide-y divide-line">
          {fixed.map((e) => (
            <li key={e} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="truncate">{e}</span>
              <span className="badge badge-muted">fixo</span>
            </li>
          ))}
          {admins
            .filter((a) => !fixed.includes(a.email))
            .map((a) => (
              <li key={a.email} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="truncate">{a.email}</span>
                {a.email !== user.email && (
                  <ActionForm action={removeAdmin}>
                    <input type="hidden" name="email" value={a.email} />
                    <SubmitButton className="btn btn-danger text-xs" pendingText="…">Remover</SubmitButton>
                  </ActionForm>
                )}
              </li>
            ))}
        </ul>
        <ActionForm action={addAdmin} className="flex flex-col gap-2" resetOnSuccess>
          <label className="field">
            <span>Adicionar admin (email Google)</span>
            <input className="input" name="email" type="email" required placeholder="nome@gmail.com" />
          </label>
          <SubmitButton>Adicionar</SubmitButton>
        </ActionForm>
        <p className="text-xs text-muted">Os admins “fixos” vêm da configuração ADMIN_EMAILS na Vercel e não podem ser removidos por aqui.</p>
      </section>

      <section className="flex flex-col gap-5">
        <div className="card p-5 flex flex-col gap-3">
          <h2 className="display text-3xl">Zerar presenças</h2>
          <p className="text-sm">
            Ciclo atual: <b>{current.name}</b>, desde {formatDateLong(current.startedAt)}.
          </p>
          <p className="text-sm text-muted">
            Use depois de cada acampamento (Corpus Christi e novembro). A contagem de todos volta a 0, mas nada é apagado: o ciclo atual fica no histórico abaixo e pode ser exportado.
          </p>
          <ActionForm action={startNewCycle} className="flex flex-col gap-3">
            <label className="field">
              <span>Nome do novo ciclo</span>
              <input className="input" name="name" required defaultValue={suggested} maxLength={80} />
            </label>
            <label className="field">
              <span>Digite ZERAR para confirmar</span>
              <input className="input" name="confirm" required autoComplete="off" pattern="ZERAR" />
            </label>
            <SubmitButton className="btn btn-danger" pendingText="Zerando…">Zerar presenças e começar novo ciclo</SubmitButton>
          </ActionForm>
        </div>

        <div className="card p-5 flex flex-col gap-2">
          <h2 className="font-bold">Histórico de ciclos</h2>
          <ul className="divide-y divide-line">
            {cycles.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <b>{c.name}</b>
                  <span className="block text-xs text-muted">
                    {formatDateLong(c.startedAt)} → {c.endedAt ? formatDateLong(c.endedAt) : "agora"}
                  </span>
                </span>
                <a href={`/admin/exportar?ciclo=${c.id}`} className="btn btn-secondary text-xs">Excel</a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
