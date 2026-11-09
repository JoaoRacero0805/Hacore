"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/inicio", label: "Início", icon: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/mural", label: "Mural", icon: "M4 5h16v11H8l-4 4z" },
  { href: "/perfil", label: "Perfil", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0" },
];
const ADMIN = { href: "/admin", label: "Painel", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" };

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  const items = isAdmin ? [...ITEMS, ADMIN] : ITEMS;
  return (
    <nav className="hidden sm:flex gap-1" aria-label="Principal">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className={`btn btn-ghost ${path.startsWith(i.href) ? "!text-laranja" : ""}`}>
            {i.label}
          </Link>
        ))}
    </nav>
  );
}

/** Barra inferior no celular (fica fora do header para o "fixed" funcionar). */
export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  const items = isAdmin ? [...ITEMS, ADMIN] : ITEMS;
  return (
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-card border-t border-line grid pb-[env(safe-area-inset-bottom)]"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
        aria-label="Principal"
      >
        {items.map((i) => {
          const active = path.startsWith(i.href);
          return (
            <Link key={i.href} href={i.href} className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${active ? "text-laranja" : "text-muted"}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                <path d={i.icon} />
              </svg>
              {i.label}
            </Link>
          );
        })}
      </nav>
  );
}
