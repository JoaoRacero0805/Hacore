import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getStore } from "@/lib/store";
import { CheckInButton } from "@/components/CheckInButton";
import { NoticeCard } from "@/components/NoticeCard";
import { formatDateLong, formatDateShort, timeSP, todaySP } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const { user } = await requireUser();
  const store = await getStore();
  const now = new Date();
  const cycle = await store.currentCycle();
  const [open, meetings, notices] = await Promise.all([
    store.openMeetings(now),
    store.userMeetings(user.id, cycle.id, true),
    store.listNotices({ activeOn: todaySP(now) }),
  ]);
  const presentIds = new Set(meetings.filter((m) => m.present).map((m) => m.id));
  const noLocationIds = new Set(meetings.filter((m) => m.location === "none").map((m) => m.id));
  const openIds = new Set(open.map((m) => m.id));
  const past = meetings.filter((m) => m.startsAt <= now);
  const upcoming = meetings.filter((m) => m.startsAt > now).sort((a, b) => +a.startsAt - +b.startsAt)[0];
  const total = past.filter((m) => m.present).length;
  const last = past.find((m) => m.present);
  const rate = past.length ? Math.round((total / past.length) * 100) : null;
  const firstName = user.name.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Olá, {firstName}!</h1>

      {open.map((m) => (
        <section key={m.id} className="rounded-2xl bg-hero text-hero-ink p-5 sm:p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-laranja">Reunião de hoje</p>
          <h2 className="display text-4xl sm:text-5xl mt-2 break-words">{m.theme}</h2>
          <p className="mt-2 text-sm opacity-90">
            {formatDateLong(m.date)} · {timeSP(m.startsAt)}
            {m.placeName ? ` · ${m.placeName}` : ""}
          </p>
          {m.description && <p className="mt-3 text-sm opacity-90 whitespace-pre-line">{m.description}</p>}
          <div className="mt-5">
            {presentIds.has(m.id) ? (
              <div className="rounded-xl bg-ok-bg text-ok p-4 font-semibold" role="status">
                ✓ Sua presença está registrada
                {noLocationIds.has(m.id) && (
                  <p className="mt-1 text-sm font-normal">
                    Não conseguimos sua localização, então a coordenação vai conferir esta presença.
                  </p>
                )}
              </div>
            ) : (
              <CheckInButton meetingId={m.id} />
            )}
          </div>
        </section>
      ))}

      {open.length === 0 && (
        <section className="rounded-2xl bg-hero text-hero-ink p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-laranja">Próxima reunião</p>
          {upcoming ? (
            <>
              <h2 className="display text-4xl mt-2">{upcoming.theme}</h2>
              <p className="mt-2 text-sm opacity-90">
                {formatDateLong(upcoming.date)} · {timeSP(upcoming.startsAt)}
                {upcoming.placeName ? ` · ${upcoming.placeName}` : ""}
              </p>
              <p className="mt-3 text-sm opacity-80">O botão de marcar presença aparece aqui quando a reunião começar.</p>
            </>
          ) : (
            <p className="mt-2">Todo sábado, 16:30. O botão de marcar presença aparece aqui quando a reunião começar.</p>
          )}
        </section>
      )}

      <section className="grid grid-cols-3 gap-3" aria-label="Suas presenças">
        <Stat value={String(total)} label="presenças" />
        <Stat value={last ? formatDateShort(last.date) : "—"} label="última" />
        <Stat value={rate == null ? "—" : `${rate}%`} label="frequência" />
      </section>

      {notices.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="display text-2xl">Mural</h2>
            <Link href="/mural" className="text-sm font-semibold text-laranja">
              Ver todos
            </Link>
          </div>
          {notices.slice(0, 2).map((n) => (
            <NoticeCard key={n.id} n={n} />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="display text-2xl">Suas reuniões</h2>
        {past.length === 0 ? (
          <p className="text-muted text-sm">Ainda não teve reunião neste ciclo.</p>
        ) : (
          <ul className="card divide-y divide-line">
            {past.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{m.theme}</p>
                  <p className="text-xs text-muted">{formatDateLong(m.date)}</p>
                </div>
                {m.present ? (
                  <span className="badge badge-ok">Presente</span>
                ) : openIds.has(m.id) ? (
                  <span className="badge badge-orange">Aberta</span>
                ) : (
                  <span className="badge badge-muted">Faltou</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted">Contagem desde {formatDateLong(cycle.startedAt)} ({cycle.name}).</p>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="display text-3xl text-laranja">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
