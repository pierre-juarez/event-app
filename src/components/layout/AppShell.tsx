"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/contexts/EventContext";
import { NavLinks } from "./NavLinks";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const { event } = useEvent();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      {/* Sidebar — escritorio */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-hairline bg-card p-4 md:flex">
        <div className="mb-6 px-1">
          <p className="text-lg font-semibold text-charcoal">🎉 {event?.title ?? "Mamá 50 Años"}</p>
        </div>
        <NavLinks className="flex flex-1 flex-col gap-1" />
        <button
          onClick={() => signOut()}
          className="mt-4 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted hover:bg-sage-light"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* Top bar — móvil */}
      <header className="flex items-center justify-between border-b border-hairline bg-card px-4 py-3 md:hidden">
        <p className="text-base font-semibold text-charcoal">
          🎉 {event?.title ?? "Mamá 50 Años"}
        </p>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-lg p-2 text-charcoal hover:bg-sage-light"
          aria-label="Abrir menú"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </header>
      {menuOpen && (
        <div className="border-b border-hairline bg-card p-3 md:hidden">
          <NavLinks className="flex flex-col gap-1" onNavigate={() => setMenuOpen(false)} />
          <button
            onClick={() => signOut()}
            className="mt-2 w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted hover:bg-sage-light"
          >
            Cerrar sesión
          </button>
        </div>
      )}

      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
