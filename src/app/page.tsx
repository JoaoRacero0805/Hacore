import { redirect } from "next/navigation";
import { Monogram } from "@/components/Logo";
import { getCurrent, DEMO_ADMIN } from "@/lib/session";
import { isDemo } from "@/lib/config";
import { demoSignIn, googleSignIn } from "./actions";

export default async function Home() {
  const current = await getCurrent();
  if (current) redirect(current.user.onboarded ? "/inicio" : "/bem-vindo");
  const demo = isDemo();

  return (
    <main className="min-h-dvh flex flex-col">
      <section className="flex-1 bg-hero text-hero-ink px-4 pt-14 pb-10 flex flex-col items-center text-center">
        <Monogram size={72} />
        <p className="mt-6 text-sm tracking-widest uppercase opacity-80">Acampamento</p>
        <h1 className="display text-6xl sm:text-7xl mt-1">Hacoré</h1>
        <p className="mt-4 max-w-sm text-base opacity-90">
          Marque sua presença nas reuniões de sábado e fique por dentro dos avisos do grupo.
        </p>

        <div className="mt-10 w-full max-w-sm flex flex-col gap-3">
          {!demo && (
            <form action={googleSignIn}>
              <button className="btn w-full py-4 bg-white text-[#1f1f1f] text-base shadow-sm hover:brightness-95">
                <GoogleIcon /> Entrar com Google
              </button>
            </form>
          )}
          {demo && (
            <div className="card p-4 text-left text-ink">
              <p className="text-sm font-semibold">Modo demonstração</p>
              <p className="text-xs text-muted mt-1">O login com Google ainda não foi configurado. Escolha um usuário de teste:</p>
              <form action={demoSignIn} className="mt-3 flex flex-col gap-2">
                <button name="email" value="jovem1@exemplo.com" className="btn btn-secondary w-full">Entrar como jovem</button>
                <button name="email" value="novo@exemplo.com" className="btn btn-secondary w-full">Entrar como jovem novo (primeiro acesso)</button>
                <button name="email" value={DEMO_ADMIN} className="btn btn-primary w-full">Entrar como coordenação</button>
              </form>
            </div>
          )}
          <p className="text-xs opacity-70">Usamos só seu nome, email e foto da conta Google. Nenhuma senha fica guardada.</p>
        </div>
      </section>
      <footer className="text-center text-xs text-muted py-4">Acampamento Católico da Hallel Escola · Franca/SP</footer>
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
