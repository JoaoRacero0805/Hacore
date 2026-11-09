import Link from "next/link";
import type { Metadata } from "next";
import { Monogram } from "@/components/Logo";

export const metadata: Metadata = { title: "Política de privacidade · Hacoré" };

export default function Privacidade() {
  return (
    <main className="min-h-dvh px-4 py-10 flex justify-center">
      <article className="w-full max-w-2xl flex flex-col gap-5 leading-relaxed">
        <Link href="/" aria-label="Voltar ao início">
          <Monogram size={44} />
        </Link>
        <h1 className="display text-4xl">Política de privacidade</h1>
        <p className="text-muted text-sm">Hacoré Presenças · Acampamento Católico da Hallel Escola, Franca/SP</p>

        <Section title="O que é este app">
          O Hacoré Presenças é usado pela coordenação do Acampamento Hacoré para registrar a presença dos campistas nas
          reuniões de sábado e publicar recados no mural.
        </Section>

        <Section title="Quais dados usamos">
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>Da sua conta Google: nome, email e foto do perfil. Não temos acesso à sua senha nem a outros dados da conta.</li>
            <li>O que você informa no cadastro: se já fez o Hacoré e em que ano.</li>
            <li>As reuniões em que você marcou presença, com data e hora.</li>
          </ul>
        </Section>

        <Section title="Localização">
          Na hora de marcar presença, o app pede permissão para ver a localização do seu celular, só para conferir se você
          está no local da reunião. A localização <strong>não é guardada</strong>: fica registrado apenas se a conferência deu
          certo ou se a presença foi marcada sem localização. Se você não permitir, a presença é registrada mesmo assim, para
          a coordenação conferir.
        </Section>

        <Section title="Quem vê seus dados">
          Só você e a coordenação do Hacoré. Os dados não são vendidos nem compartilhados com terceiros e não são usados para
          propaganda. Eles ficam guardados em servidores da Vercel e da Neon, usados para hospedar o app.
        </Section>

        <Section title="Como pedir para apagar seus dados">
          Fale com a coordenação do Hacoré. Sua conta e suas presenças podem ser apagadas a qualquer momento.
        </Section>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-bold text-lg">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
