"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useEvent } from "@/contexts/EventContext";
import {
  createGuest,
  createGuestCategory,
  deleteGuest,
  deleteGuestCategory,
  fetchGuestCategories,
  fetchGuests,
  moveGuestToCategory,
  updateGuest,
  updateGuestCategory,
} from "@/services/guestService";
import type { GuestCategoryRow, GuestRow, RsvpStatus } from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Spinner } from "@/components/ui/Spinner";
import { RsvpStatusChip, WhatsappInviteChip } from "@/components/ui/StatusChip";
import { RSVP_LABELS } from "@/lib/format";

const RSVP_OPTIONS: RsvpStatus[] = ["pending", "confirmed", "declined"];
const UNCATEGORIZED = "__uncategorized__";

interface Group {
  id: string;
  title: string;
  category: GuestCategoryRow | null;
  guests: GuestRow[];
}

export default function GuestsPage() {
  const { event } = useEvent();
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [categories, setCategories] = useState<GuestCategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<RsvpStatus | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [showGuestForm, setShowGuestForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestRow | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<GuestRow | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GuestCategoryRow | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<GuestCategoryRow | null>(null);

  useEffect(() => {
    if (!event) return;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [g, c] = await Promise.all([
          fetchGuests(event.id),
          fetchGuestCategories(event.id),
        ]);
        setGuests(g);
        setCategories(c);
      } catch (e) {
        setError(`No se pudieron cargar los invitados: ${(e as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [event]);

  const filteredGuests = useMemo(
    () =>
      guests.filter((g) => {
        const matchesStatus = !statusFilter || g.rsvp_status === statusFilter;
        const matchesSearch =
          !searchText || g.full_name.toLowerCase().includes(searchText.toLowerCase());
        return matchesStatus && matchesSearch;
      }),
    [guests, statusFilter, searchText]
  );

  const groups: Group[] = useMemo(() => {
    const byCategory = new Map<string, GuestRow[]>();
    for (const guest of filteredGuests) {
      const key = guest.category_id ?? UNCATEGORIZED;
      byCategory.set(key, [...(byCategory.get(key) ?? []), guest]);
    }
    const result: Group[] = [];
    for (const category of [...categories].sort((a, b) => a.sort_order - b.sort_order)) {
      const guestsInCategory = byCategory.get(category.id);
      if (guestsInCategory?.length) {
        result.push({ id: category.id, title: category.name, category, guests: guestsInCategory });
      }
    }
    const uncategorized = byCategory.get(UNCATEGORIZED);
    if (uncategorized?.length) {
      result.push({ id: UNCATEGORIZED, title: "Sin categoría", category: null, guests: uncategorized });
    }
    return result;
  }, [filteredGuests, categories]);

  function toggleCollapsed(groupId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  async function handleDeleteGuest() {
    if (!deletingGuest) return;
    await deleteGuest(deletingGuest.id);
    setGuests((prev) => prev.filter((g) => g.id !== deletingGuest.id));
    setDeletingGuest(null);
  }

  async function handleDeleteCategory() {
    if (!deletingCategory) return;
    await deleteGuestCategory(deletingCategory.id);
    setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
    setGuests((prev) =>
      prev.map((g) => (g.category_id === deletingCategory.id ? { ...g, category_id: null } : g))
    );
    setDeletingCategory(null);
  }

  async function moveWithinGroup(group: Group, guest: GuestRow, direction: -1 | 1) {
    const index = group.guests.findIndex((g) => g.id === guest.id);
    const target = group.guests[index + direction];
    if (!target) return;
    const [updatedA, updatedB] = await Promise.all([
      updateGuest(guest.id, { sort_order: target.sort_order }),
      updateGuest(target.id, { sort_order: guest.sort_order }),
    ]);
    setGuests((prev) =>
      prev.map((g) => {
        if (g.id === updatedA.id) return updatedA;
        if (g.id === updatedB.id) return updatedB;
        return g;
      })
    );
  }

  if (!event) return null;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Invitados"
        subtitle="Lista, RSVP y categorías"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowCategoryForm(true)}>
              + Categoría
            </Button>
            <Button onClick={() => setShowGuestForm(true)}>+ Invitado</Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Buscar por nombre…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setStatusFilter(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              statusFilter === null ? "bg-sage text-white" : "bg-sage-light text-charcoal"
            }`}
          >
            Todos
          </button>
          {RSVP_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                statusFilter === status ? "bg-sage text-white" : "bg-sage-light text-charcoal"
              }`}
            >
              {RSVP_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      <ErrorBanner message={error} />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState icon="👥" title="Sin invitados" subtitle="Agrega a tu primer invitado." />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <Card key={group.id}>
              <button
                className="flex w-full items-center justify-between"
                onClick={() => toggleCollapsed(group.id)}
              >
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-charcoal">{group.title}</h2>
                  <span className="text-xs text-muted">({group.guests.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  {group.category && (
                    <>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(group.category);
                        }}
                        className="rounded-full px-2 py-1 text-xs text-muted hover:bg-sage-light"
                      >
                        ✏️
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingCategory(group.category);
                        }}
                        className="rounded-full px-2 py-1 text-xs text-muted hover:bg-declined/15 hover:text-declined"
                      >
                        🗑️
                      </span>
                    </>
                  )}
                  <span className="text-muted">{collapsed.has(group.id) ? "▸" : "▾"}</span>
                </div>
              </button>

              {!collapsed.has(group.id) && (
                <ul className="mt-2 flex flex-col divide-y divide-hairline">
                  {group.guests.map((guest, index) => (
                    <li key={guest.id} className="flex items-center gap-2 py-2.5">
                      <div className="flex flex-col">
                        <button
                          disabled={index === 0}
                          onClick={() => moveWithinGroup(group, guest, -1)}
                          className="text-xs text-muted hover:text-charcoal disabled:opacity-20"
                          aria-label="Subir"
                        >
                          ▲
                        </button>
                        <button
                          disabled={index === group.guests.length - 1}
                          onClick={() => moveWithinGroup(group, guest, 1)}
                          className="text-xs text-muted hover:text-charcoal disabled:opacity-20"
                          aria-label="Bajar"
                        >
                          ▼
                        </button>
                      </div>
                      <button className="flex-1 text-left" onClick={() => setEditingGuest(guest)}>
                        <p className="text-sm font-medium text-charcoal">
                          {guest.full_name}
                          {guest.plus_ones > 0 && (
                            <span className="ml-1 text-xs text-muted">+{guest.plus_ones}</span>
                          )}
                        </p>
                        {(guest.contact_phone || guest.contact_email) && (
                          <p className="text-xs text-muted">
                            {[guest.contact_phone, guest.contact_email].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </button>
                      <WhatsappInviteChip value={guest.whatsapp_invite_ok} />
                      <RsvpStatusChip status={guest.rsvp_status} />
                      <button
                        onClick={() => setDeletingGuest(guest)}
                        className="rounded-full p-1 text-muted hover:bg-declined/15 hover:text-declined"
                        aria-label="Eliminar"
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}

      {(showGuestForm || editingGuest) && (
        <GuestFormModal
          eventId={event.id}
          guest={editingGuest}
          categories={categories}
          guests={guests}
          onClose={() => {
            setShowGuestForm(false);
            setEditingGuest(null);
          }}
          onSaved={(guest) => {
            setGuests((prev) => {
              const exists = prev.some((g) => g.id === guest.id);
              return exists ? prev.map((g) => (g.id === guest.id ? guest : g)) : [...prev, guest];
            });
            setShowGuestForm(false);
            setEditingGuest(null);
          }}
        />
      )}

      {(showCategoryForm || editingCategory) && (
        <CategoryFormModal
          eventId={event.id}
          category={editingCategory}
          categories={categories}
          onClose={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
          onSaved={(category) => {
            setCategories((prev) => {
              const exists = prev.some((c) => c.id === category.id);
              return exists ? prev.map((c) => (c.id === category.id ? category : c)) : [...prev, category];
            });
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
        />
      )}

      {deletingGuest && (
        <ConfirmDialog
          title="Eliminar invitado"
          message={`¿Eliminar a "${deletingGuest.full_name}"?`}
          onConfirm={handleDeleteGuest}
          onCancel={() => setDeletingGuest(null)}
        />
      )}

      {deletingCategory && (
        <ConfirmDialog
          title="Eliminar categoría"
          message={`¿Eliminar "${deletingCategory.name}"? Los invitados pasarán a "Sin categoría".`}
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeletingCategory(null)}
        />
      )}
    </div>
  );
}

function GuestFormModal({
  eventId,
  guest,
  categories,
  guests,
  onClose,
  onSaved,
}: {
  eventId: string;
  guest: GuestRow | null;
  categories: GuestCategoryRow[];
  guests: GuestRow[];
  onClose: () => void;
  onSaved: (guest: GuestRow) => void;
}) {
  const [fullName, setFullName] = useState(guest?.full_name ?? "");
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(guest?.rsvp_status ?? "pending");
  const [plusOnes, setPlusOnes] = useState(String(guest?.plus_ones ?? 0));
  const [phone, setPhone] = useState(guest?.contact_phone ?? "");
  const [email, setEmail] = useState(guest?.contact_email ?? "");
  const [notes, setNotes] = useState(guest?.notes ?? "");
  const [categoryId, setCategoryId] = useState(guest?.category_id ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const nextCategoryId = categoryId || null;
      const payload = {
        full_name: fullName,
        rsvp_status: rsvpStatus,
        plus_ones: Number(plusOnes) || 0,
        contact_phone: phone || null,
        contact_email: email || null,
        notes: notes || null,
      };
      let saved: GuestRow;
      if (guest) {
        saved = await updateGuest(guest.id, payload);
        if (nextCategoryId !== guest.category_id) {
          const maxOrder = Math.max(
            -1,
            ...guests.filter((g) => g.category_id === nextCategoryId && g.id !== guest.id).map((g) => g.sort_order)
          );
          saved = await moveGuestToCategory(guest.id, nextCategoryId, maxOrder + 1);
        }
      } else {
        const maxOrder = Math.max(-1, ...guests.filter((g) => g.category_id === nextCategoryId).map((g) => g.sort_order));
        saved = await createGuest({
          event_id: eventId,
          ...payload,
          category_id: nextCategoryId,
          sort_order: maxOrder + 1,
        });
      }
      onSaved(saved);
    } catch (e) {
      setError(`No se pudo guardar: ${(e as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={guest ? "Editar invitado" : "Nuevo invitado"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="guest-name">Nombre completo</Label>
          <Input id="guest-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="guest-rsvp">RSVP</Label>
            <Select
              id="guest-rsvp"
              value={rsvpStatus}
              onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
            >
              {RSVP_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {RSVP_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="guest-plusones">Acompañantes</Label>
            <Input
              id="guest-plusones"
              type="number"
              min={0}
              value={plusOnes}
              onChange={(e) => setPlusOnes(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="guest-category">Categoría</Label>
          <Select id="guest-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="guest-phone">Teléfono</Label>
            <Input id="guest-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="guest-email">Correo</Label>
            <Input id="guest-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="guest-notes">Notas</Label>
          <Textarea id="guest-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <ErrorBanner message={error} />
        <Button type="submit" disabled={!fullName} isLoading={isSaving}>
          {guest ? "Guardar cambios" : "Agregar invitado"}
        </Button>
      </form>
    </Modal>
  );
}

function CategoryFormModal({
  eventId,
  category,
  categories,
  onClose,
  onSaved,
}: {
  eventId: string;
  category: GuestCategoryRow | null;
  categories: GuestCategoryRow[];
  onClose: () => void;
  onSaved: (category: GuestCategoryRow) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const saved = category
        ? await updateGuestCategory(category.id, { name })
        : await createGuestCategory({
            event_id: eventId,
            name,
            sort_order: Math.max(-1, ...categories.map((c) => c.sort_order)) + 1,
          });
      onSaved(saved);
    } catch (e) {
      setError(`No se pudo guardar: ${(e as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={category ? "Editar categoría" : "Nueva categoría"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="category-name">Nombre</Label>
          <Input
            id="category-name"
            placeholder="Ej. Familia, Amigos, Trabajo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <ErrorBanner message={error} />
        <Button type="submit" disabled={!name} isLoading={isSaving}>
          {category ? "Guardar cambios" : "Crear categoría"}
        </Button>
      </form>
    </Modal>
  );
}
