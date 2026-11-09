import { getStore } from "@/lib/store";
import { requireAdmin } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { LocateButton } from "@/components/LocateButton";
import type { Place } from "@/lib/store/types";
import { deletePlace, savePlace, setDefaultPlace } from "../actions";

export const dynamic = "force-dynamic";

function PlaceForm({ place }: { place?: Place }) {
  const key = place?.id ?? "novo";
  return (
    <ActionForm action={savePlace} className="flex flex-col gap-3" resetOnSuccess={!place}>
      {place && <input type="hidden" name="id" value={place.id} />}
      <label className="field">
        <span>Nome</span>
        <input className="input" name="name" required defaultValue={place?.name} placeholder="Ex.: Paróquia São Sebastião" />
      </label>
      <label className="field">
        <span>Endereço</span>
        <input className="input" name="address" defaultValue={place?.address} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="field">
          <span>Latitude</span>
          <input className="input" id={`lat-${key}`} name="lat" inputMode="decimal" defaultValue={place?.lat ?? ""} placeholder="-20.5386" />
        </label>
        <label className="field">
          <span>Longitude</span>
          <input className="input" id={`lng-${key}`} name="lng" inputMode="decimal" defaultValue={place?.lng ?? ""} placeholder="-47.4009" />
        </label>
      </div>
      <LocateButton latId={`lat-${key}`} lngId={`lng-${key}`} />
      <label className="field">
        <span>Raio permitido (metros)</span>
        <input className="input" name="radiusM" type="number" min={20} max={5000} defaultValue={place?.radiusM ?? 150} />
      </label>
      <SubmitButton>{place ? "Salvar local" : "Adicionar local"}</SubmitButton>
    </ActionForm>
  );
}

export default async function Locais() {
  await requireAdmin();
  const places = await (await getStore()).listPlaces();
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="display text-4xl">Locais</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          A presença só é aceita dentro do raio do local da reunião. O jeito mais fácil de marcar o ponto é abrir esta tela
          <b> no celular, estando no local</b>, e tocar em “Usar minha localização atual”.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 items-start">
        {places.map((p) => (
          <section key={p.id} className="card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-lg">{p.name}</h2>
              {p.isDefault ? (
                <span className="badge badge-orange">Padrão</span>
              ) : (
                <form action={setDefaultPlace}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn btn-ghost text-sm">Tornar padrão</button>
                </form>
              )}
            </div>
            {p.lat == null ? (
              <p className="rounded-lg bg-warn-bg text-warn p-3 text-sm font-medium">
                Ponto no mapa ainda não definido: enquanto isso, as presenças aqui ficam marcadas como “sem localização”.
              </p>
            ) : (
              <a className="text-sm text-laranja underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}>
                Conferir o ponto no Google Maps ↗
              </a>
            )}
            <PlaceForm place={p} />
            {!p.isDefault && (
              <ActionForm action={deletePlace}>
                <input type="hidden" name="id" value={p.id} />
                <SubmitButton className="btn btn-danger text-sm w-full" pendingText="Excluindo…">Excluir local</SubmitButton>
              </ActionForm>
            )}
          </section>
        ))}
        <section className="card p-5 flex flex-col gap-3">
          <h2 className="font-bold text-lg">Novo local</h2>
          <p className="text-xs text-muted">Para reuniões fora da Escola Hallel.</p>
          <PlaceForm />
        </section>
      </div>
    </div>
  );
}
