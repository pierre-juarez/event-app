"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/contexts/EventContext";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export default function SettingsPage() {
  const { signOut } = useAuth();
  const { event, updateEvent, errorMessage } = useEvent();
  const [title, setTitle] = useState(event?.title ?? "");
  const [eventDate, setEventDate] = useState(event?.event_date?.slice(0, 10) ?? "");
  const [venueName, setVenueName] = useState(event?.venue_name ?? "");
  const [venueAddress, setVenueAddress] = useState(event?.venue_address ?? "");
  const [totalBudget, setTotalBudget] = useState(event ? String(event.total_budget) : "");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [showSignOutConfirmation, setShowSignOutConfirmation] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const inviteLink =
    typeof window !== "undefined" ? `${window.location.origin}/invite/${event.share_token}` : "";

  async function handleCopyInviteLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    await updateEvent({
      title,
      event_date: new Date(eventDate).toISOString(),
      venue_name: venueName || null,
      venue_address: venueAddress || null,
      total_budget: Number(totalBudget.replace(/,/g, "")) || 0,
      notes: notes || null,
    });
    setIsSaving(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Ajustes del evento" subtitle="Edítalos cuando cambien los planes" />

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="settings-title">Título</Label>
            <Input id="settings-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="settings-date">Fecha</Label>
            <Input
              id="settings-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="settings-venue">Lugar</Label>
            <Input id="settings-venue" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="settings-address">Dirección</Label>
            <Input
              id="settings-address"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="settings-budget">Presupuesto total</Label>
            <Input
              id="settings-budget"
              inputMode="decimal"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="settings-notes">Notas</Label>
            <Textarea id="settings-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <ErrorBanner message={errorMessage} />
          <Button type="submit" disabled={!title} isLoading={isSaving}>
            Guardar cambios
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-medium text-charcoal">Compartir con mamá</h2>
        <p className="mt-1 text-sm text-muted">
          Este link no pide iniciar sesión. Solo muestra los nombres de los invitados y deja
          responder Sí/No a &quot;¿se puede invitar por WhatsApp?&quot; para cada uno.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input value={inviteLink} readOnly onFocus={(e) => e.currentTarget.select()} />
          <Button variant="secondary" onClick={handleCopyInviteLink} className="shrink-0">
            {copied ? "¡Copiado!" : "Copiar link"}
          </Button>
        </div>
      </Card>

      <Button variant="destructive" onClick={() => setShowSignOutConfirmation(true)}>
        Cerrar sesión
      </Button>

      {showSignOutConfirmation && (
        <ConfirmDialog
          title="¿Cerrar sesión?"
          message="Tendrás que volver a iniciar sesión para seguir planeando el evento."
          confirmLabel="Cerrar sesión"
          onConfirm={() => signOut()}
          onCancel={() => setShowSignOutConfirmation(false)}
        />
      )}
    </div>
  );
}
