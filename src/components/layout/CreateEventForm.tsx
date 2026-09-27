"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/contexts/EventContext";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

function defaultEventDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString().slice(0, 10);
}

export function CreateEventForm() {
  const { signOut } = useAuth();
  const { createEvent, errorMessage } = useEvent();
  const [title, setTitle] = useState("Fiesta de 50 años de Mamá");
  const [eventDate, setEventDate] = useState(defaultEventDate());
  const [venueName, setVenueName] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    await createEvent({
      title,
      event_date: new Date(eventDate).toISOString(),
      venue_name: venueName || null,
      total_budget: Number(totalBudget.replace(/,/g, "")) || 0,
    });
    setIsSaving(false);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-4xl">🎉</p>
          <h1 className="mt-2 text-xl font-semibold text-charcoal">Creemos tu evento</h1>
          <p className="mt-1 text-sm text-muted">
            Solo lo pedimos una vez — luego podrás editarlo en Ajustes
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="eventDate">Fecha</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="venueName">Lugar (opcional)</Label>
              <Input
                id="venueName"
                placeholder="Ej. Salón Jardín Las Flores"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="totalBudget">Presupuesto total (opcional)</Label>
              <Input
                id="totalBudget"
                inputMode="decimal"
                placeholder="Ej. 50000"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
              />
            </div>
            <ErrorBanner message={errorMessage} />
            <Button type="submit" disabled={!title || isSaving} isLoading={isSaving}>
              Crear evento
            </Button>
          </form>
        </Card>

        <button
          onClick={() => signOut()}
          className="mt-4 w-full text-center text-sm text-muted hover:text-charcoal"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
