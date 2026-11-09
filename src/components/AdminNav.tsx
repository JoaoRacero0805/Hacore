"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Campistas", exact: true },
  { href: "/admin/reunioes", label: "Reuniões" },
  { href: "/admin/mural", label: "Mural" },
  { href: "/admin/locais", label: "Locais" },
  { href: "/admin/config", label: "Admins e ciclos" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto -mx-4 px-4 pb-1" aria-label="Painel">
      {ITEMS.map((i) => {
        const active = i.exact ? path === i.href || path.startsWith("/admin/campistas") : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${active ? "bg-laranja text-white" : "bg-soft text-ink"}`}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
