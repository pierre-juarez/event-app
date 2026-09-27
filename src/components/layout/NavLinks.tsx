"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: "🏠" },
  { href: "/guests", label: "Invitados", icon: "👥" },
  { href: "/budget", label: "Presupuesto", icon: "💰" },
  { href: "/vendors", label: "Proveedores", icon: "🛍️" },
  { href: "/tasks", label: "Tareas", icon: "✅" },
  { href: "/itinerary", label: "Itinerario", icon: "🕒" },
  { href: "/settings", label: "Ajustes", icon: "⚙️" },
] as const;

export function NavLinks({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className={className}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={clsx(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-sage text-white"
                : "text-charcoal hover:bg-sage-light"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
