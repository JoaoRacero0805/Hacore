import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh pb-10">
      <header className="sticky top-0 z-10 bg-bg/90 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo />
            <span className="badge badge-orange">Painel</span>
          </Link>
          <Link href="/inicio" className="btn btn-ghost text-sm">
            Voltar ao app
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <AdminNav />
      </div>
      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
    </div>
  );
}
