"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/matriz", label: "Matriz" },
  { href: "/bitacora", label: "Bitácora" },
  { href: "/vigilancia", label: "Vigilancia normativa" },
  { href: "/historial", label: "Historial de cambios" },
  { href: "/usuarios", label: "Usuarios" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 text-sm">
      {NAV_LINKS.map((link) => {
        const activo = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              activo
                ? "rounded-md px-3 py-1.5 font-medium bg-teal-600/10 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300"
                : "rounded-md px-3 py-1.5 text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
