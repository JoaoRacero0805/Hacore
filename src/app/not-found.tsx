import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="display text-5xl">Página não encontrada</h1>
      <Link href="/inicio" className="btn btn-primary">Voltar ao início</Link>
    </main>
  );
}
