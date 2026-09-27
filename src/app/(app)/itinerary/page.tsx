"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useEvent } from "@/contexts/EventContext";
import {
  createItineraryItem,
  deleteItineraryItem,
  fetchItineraryItems,
  updateItineraryItem,
} from "@/services/itineraryService";
import type { ItineraryItemRow } from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Spinner } from "@/components/ui/Spinner";
import { formatTime } from "@/lib/format";

export default function ItineraryPage() {
  const { event } = useEvent();
  const [items, setItems] = useState<ItineraryItemRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItemRow | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItineraryItemRow | null>(null);

  useEffect(() => {
    if (!event) return;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        setItems(await fetchItineraryItems(event.id));
      } catch (e) {
        setError(`No se pudo cargar el itinerario: ${(e as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [event]);

  function upsert(item: ItineraryItemRow) {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      const next = exists ? prev.map((i) => (i.id === item.id ? item : i)) : [...prev, item];
      return next.sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
  }

  async function handleDelete() {
    if (!deletingItem) return;
    await deleteItineraryItem(deletingItem.id);
    setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
    setDeletingItem(null);
  }

  if (!event) return null;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Itinerario"
        subtitle="El día del evento, minuto a minuto"
        action={<Button onClick={() => setShowForm(true)}>+ Agregar</Button>}
      />

      <ErrorBanner message={error} />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="🕒" title="Itinerario vacío" subtitle="Agrega la primera actividad del día." />
      ) : (
        <Card>
          <ol className="relative flex flex-col gap-0 border-l-2 border-sage-light pl-5">
            {items.map((item) => (
              <li key={item.id} className="relative py-3">
                <span className="absolute -left-[27px] top-4 h-3 w-3 rounded-full bg-sage" />
                <div className="flex items-start justify-between gap-3">
                  <button className="text-left" onClick={() => setEditingItem(item)}>
                    <p className="text-xs font-semibold text-sage-dark">
                      {formatTime(item.start_time)}
                    </p>
                    <p className="text-sm font-medium text-charcoal">{item.activity}</p>
                    {item.notes && <p className="text-xs text-muted">{item.notes}</p>}
                  </button>
                  <button
                    onClick={() => setDeletingItem(item)}
                    className="rounded-full p-1 text-muted hover:bg-declined/15 hover:text-declined"
                    aria-label="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {(showForm || editingItem) && (
        <ItineraryFormModal
          eventId={event.id}
          item={editingItem}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSaved={(item) => {
            upsert(item);
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {deletingItem && (
        <ConfirmDialog
          title="Eliminar actividad"
          message={`¿Eliminar "${deletingItem.activity}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingItem(null)}
        />
      )}
    </div>
  );
}

function ItineraryFormModal({
  eventId,
  item,
  onClose,
  onSaved,
}: {
  eventId: string;
  item: ItineraryItemRow | null;
  onClose: () => void;
  onSaved: (item: ItineraryItemRow) => void;
}) {
  const [startTime, setStartTime] = useState(item?.start_time?.slice(0, 5) ?? "12:00");
  const [activity, setActivity] = useState(item?.activity ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload = { start_time: `${startTime}:00`, activity, notes: notes || null };
      const saved = item
        ? await updateItineraryItem(item.id, payload)
        : await createItineraryItem({ event_id: eventId, ...payload });
      onSaved(saved);
    } catch (e) {
      setError(`No se pudo guardar: ${(e as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={item ? "Editar actividad" : "Nueva actividad"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="it-time">Hora</Label>
          <Input
            id="it-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="it-activity">Actividad</Label>
          <Input
            id="it-activity"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="it-notes">Notas</Label>
          <Textarea id="it-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <ErrorBanner message={error} />
        <Button type="submit" disabled={!activity} isLoading={isSaving}>
          {item ? "Guardar cambios" : "Agregar"}
        </Button>
      </form>
    </Modal>
  );
}
