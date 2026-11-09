import Link from "next/link";
import { redirect } from "next/navigation";
import { Monogram } from "@/components/Logo";
import { getCurrent, DEMO_ADMIN } from "@/lib/session";
import { isDemo } from "@/lib/config";
import { demoSignIn, googleSignIn } from "./actions";

type SP = Promise<{ modo?: string }>;

export default async function Home({ searchParams }: { searchParams: SP }) {
  const current = await getCurrent();
  if (current) redirect(current.user.onboarded ? "/inicio" : "/bem-vindo");
  const demo = isDemo();
  const criar = (await searchParams).modo === "criar";

  return (
    <main className="min-h-dvh flex flex-col">
      <section className="flex-1 bg-hero text-hero-ink px-4 pt-14 pb-10 flex flex-col items-center text-center">
        <Monogram size={72} />
        <p className="mt-6 text-sm tracking-widest uppercase opacity-80">Acampamento</p>
        <h1 className="display text-6xl sm:text-7xl mt-1">Hacoré</h1>

        <div className="mt-10 w-full max-w-sm card p-5 text-left text-ink flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-1 rounded-full bg-soft p-1 text-sm font-semibold" role="tablist">
            <Link href="/" replace role="tab" aria-selected={!criar} className={`rounded-full py-2 text-center ${!criar ? "bg-laranja text-white" : "text-muted"}`}>
              Fazer login
            </Link>
            <Link href="/?modo=criar" replace role="tab" aria-selected={criar} className={`rounded-full py-2 text-center ${criar ? "bg-laranja text-white" : "text-muted"}`}>
              Criar conta
            </Link>
          </div>
          <p className="text-sm text-muted">
            {criar
              ? "Use sua conta Google. Depois é só dizer quando você fez o Hacoré."
              : "Entre com a conta Google que você usou no cadastro."}
          </p>

          {!demo && (
            <form action={googleSignIn}>
              <button className="btn w-full py-3.5 bg-white text-[#1f1f1f] border border-line text-base shadow-sm hover:brightness-95">
                <GoogleIcon /> {criar ? "Criar conta com Google" : "Entrar com Google"}
              </button>
            </form>
          )}
          {demo && (
            <form action={demoSignIn} className="flex flex-col gap-2">
              <label className="field">
                <span>Email (modo demonstração)</span>
                <input className="input" name="email" type="email" required autoComplete="off" placeholder="voce@gmail.com" />
              </label>
              <button className="btn btn-primary w-full">{criar ? "Criar conta" : "Entrar"}</button>
              <p className="text-xs text-muted">
                O login com Google ainda não foi configurado. Para testar a coordenação, use {DEMO_ADMIN}.
              </p>
            </form>
          )}
          <p className="text-xs text-muted">
            Se o seu email for da coordenação, o painel já aparece pra você. Nenhuma senha fica guardada.
          </p>
        </div>
      </section>
      <footer className="text-center text-xs text-muted py-4">
        Acampamento Católico da Hallel Escola · Franca/SP ·{" "}
        <Link href="/privacidade" className="underline">Privacidade</Link>
      </footer>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
