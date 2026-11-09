import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AppNav, BottomNav } from "@/components/AppNav";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = await requireUser();
  return (
    <div className="min-h-dvh pb-20 sm:pb-8">
      <header className="sticky top-0 z-10 bg-bg/90 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link href="/inicio" aria-label="Início">
            <Logo />
          </Link>
          <AppNav isAdmin={isAdmin} />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
