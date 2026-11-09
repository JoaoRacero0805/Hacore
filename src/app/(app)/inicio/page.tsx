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
  // Último recado publicado (o mais recente, fixado ou não).
  const latest = [...notices].sort((a, b) => +b.createdAt - +a.createdAt)[0];
  const history = past.filter((m) => !openIds.has(m.id));

  return (
    <div className="flex flex-col gap-6">
      {open.map((m) => (
        <section key={m.id} className="rounded-2xl bg-hero text-hero-ink p-5 sm:p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-laranja">Reunião de hoje</p>
          <h1 className="display text-4xl sm:text-5xl mt-2 break-words">{m.theme}</h1>
          <p className="mt-2 text-sm opacity-90">
            {formatDateLong(m.date)} · {timeSP(m.startsAt)}
            {m.placeName ? ` · ${m.placeName}` : ""}
          </p>
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
              <h1 className="display text-4xl mt-2 break-words">{upcoming.theme}</h1>
              <p className="mt-2 text-sm opacity-90">
                {formatDateLong(upcoming.date)} · {timeSP(upcoming.startsAt)}
                {upcoming.placeName ? ` · ${upcoming.placeName}` : ""}
              </p>
            </>
          ) : (
            <h1 className="display text-3xl mt-2">Sábado, 16:30</h1>
          )}
          <p className="mt-3 text-sm opacity-80">O botão de marcar presença aparece aqui quando a reunião começar.</p>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3" aria-label="Suas presenças">
        <Stat value={String(total)} label={total === 1 ? "presença" : "presenças"} />
        <Stat value={last ? formatDateShort(last.date) : "—"} label="última reunião" />
      </section>

      {latest && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="display text-2xl">Último recado</h2>
            <Link href="/mural" className="text-sm font-semibold text-laranja">
              Ver mural
            </Link>
          </div>
          <NoticeCard n={latest} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="display text-2xl">Reuniões anteriores</h2>
        {history.length === 0 ? (
          <p className="text-muted text-sm">Ainda não teve reunião neste ciclo.</p>
        ) : (
          <ul className="card divide-y divide-line">
            {history.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{m.theme}</p>
                  <p className="text-xs text-muted">{formatDateLong(m.date)}</p>
                </div>
                {m.present ? <span className="badge badge-ok">Presente</span> : <span className="badge badge-muted">Faltou</span>}
              </li>
            ))}
          </ul>
        )}
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
