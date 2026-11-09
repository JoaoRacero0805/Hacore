import type { Meeting, Place } from "@/lib/store/types";
import { timeSP } from "@/lib/time";

export function MeetingFields({ meeting, places, defaultDate }: { meeting?: Meeting; places: Place[]; defaultDate: string }) {
  const def = places.find((p) => p.isDefault)?.id ?? places[0]?.id ?? "";
  return (
    <>
      {meeting && <input type="hidden" name="id" value={meeting.id} />}
      <label className="field">
        <span>Tema</span>
        <input className="input" name="theme" required maxLength={120} defaultValue={meeting?.theme} placeholder="Ex.: Sagrado Coração" />
      </label>
      <label className="field">
        <span>Descrição (opcional)</span>
        <textarea className="input min-h-20" name="description" maxLength={2000} defaultValue={meeting?.description} />
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="field">
          <span>Data</span>
          <input className="input" type="date" name="date" required defaultValue={meeting?.date ?? defaultDate} />
        </label>
        <label className="field">
          <span>Início (abre a presença)</span>
          <input className="input" type="time" name="startTime" required defaultValue={meeting ? timeSP(meeting.startsAt) : "16:30"} />
        </label>
        <label className="field">
          <span>Presença fecha às</span>
          <input className="input" type="time" name="closeTime" required defaultValue={meeting ? timeSP(meeting.closesAt) : "23:59"} />
        </label>
      </div>
      <label className="field">
        <span>Local</span>
        <select className="input" name="placeId" defaultValue={meeting ? (meeting.placeId ?? "") : def}>
          {places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.lat == null ? " (sem ponto no mapa)" : ` (raio ${p.radiusM} m)`}
            </option>
          ))}
          <option value="">Sem local (não confere localização)</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="isVisible" defaultChecked={meeting ? meeting.isVisible : true} className="size-4 accent-[var(--laranja)]" />
        Visível para os jovens
      </label>
    </>
  );
}
