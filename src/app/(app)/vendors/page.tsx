"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useEvent } from "@/contexts/EventContext";
import {
  createVendorCategory,
  createVendorOption,
  deleteVendorCategory,
  deleteVendorOption,
  fetchAllVendorOptions,
  fetchVendorCategories,
  fetchVendorOptions,
  selectVendorOption,
  updateVendorOption,
} from "@/services/vendorService";
import { createExpense, fetchCategorySummaries } from "@/services/budgetService";
import type {
  BudgetCategorySummaryRow,
  VendorCategoryRow,
  VendorOptionRow,
} from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Spinner } from "@/components/ui/Spinner";
import { VendorStatusChip } from "@/components/ui/StatusChip";
import { formatCurrency, todaySqlDate } from "@/lib/format";

export default function VendorsPage() {
  const { event } = useEvent();
  const [categories, setCategories] = useState<VendorCategoryRow[]>([]);
  const [optionsByCategory, setOptionsByCategory] = useState<Record<string, VendorOptionRow[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<VendorCategoryRow | null>(null);
  const [openCategory, setOpenCategory] = useState<VendorCategoryRow | null>(null);

  async function load() {
    if (!event) return;
    setIsLoading(true);
    setError(null);
    try {
      const [cats, allOptions] = await Promise.all([
        fetchVendorCategories(event.id),
        fetchAllVendorOptions(event.id),
      ]);
      setCategories(cats);
      const grouped: Record<string, VendorOptionRow[]> = {};
      for (const option of allOptions) {
        grouped[option.vendor_category_id] = [...(grouped[option.vendor_category_id] ?? []), option];
      }
      setOptionsByCategory(grouped);
    } catch (e) {
      setError(`No se pudieron cargar las categorías: ${(e as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() fetches remote data on mount, not derived state
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  async function handleDeleteCategory() {
    if (!deletingCategory) return;
    await deleteVendorCategory(deletingCategory.id);
    setDeletingCategory(null);
    await load();
  }

  if (!event) return null;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Proveedores"
        subtitle="Compara cotizaciones y elige"
        action={<Button onClick={() => setShowCategoryForm(true)}>+ Categoría</Button>}
      />

      <ErrorBanner message={error} />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title="Sin categorías de proveedores"
          subtitle="Crea categorías como Salón, Catering, Música…"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((category) => {
            const options = optionsByCategory[category.id] ?? [];
            const selected = options.find((o) => o.status === "selected");
            const cheapest = options
              .map((o) => o.price)
              .filter((p): p is number => p != null)
              .sort((a, b) => a - b)[0];
            return (
              <Card key={category.id}>
                <button className="w-full text-left" onClick={() => setOpenCategory(category)}>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-medium text-charcoal">{category.name}</h3>
                    <span className="text-xs text-muted">{options.length} cotizaciones</span>
                  </div>
                  {selected ? (
                    <p className="text-sm text-warm">
                      ✓ {selected.vendor_name}
                      {selected.price != null && ` · ${formatCurrency(selected.price)}`}
                    </p>
                  ) : cheapest != null ? (
                    <p className="text-sm text-muted">Desde {formatCurrency(cheapest)}</p>
                  ) : (
                    <p className="text-sm text-muted">Sin cotizaciones aún</p>
                  )}
                </button>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => setDeletingCategory(category)}
                    className="rounded-full px-2 py-1 text-xs text-muted hover:bg-declined/15 hover:text-declined"
                  >
                    Eliminar categoría
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showCategoryForm && (
        <CategoryFormModal
          eventId={event.id}
          onClose={() => setShowCategoryForm(false)}
          onSaved={async () => {
            setShowCategoryForm(false);
            await load();
          }}
        />
      )}

      {deletingCategory && (
        <ConfirmDialog
          title="Eliminar categoría"
          message={`¿Eliminar "${deletingCategory.name}"? También se eliminarán sus cotizaciones.`}
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeletingCategory(null)}
        />
      )}

      {openCategory && (
        <OptionsModal
          eventId={event.id}
          category={openCategory}
          onClose={() => setOpenCategory(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function CategoryFormModal({
  eventId,
  onClose,
  onSaved,
}: {
  eventId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await createVendorCategory({ event_id: eventId, name });
      onSaved();
    } catch (e) {
      setError(`No se pudo guardar: ${(e as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title="Nueva categoría" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="vcat-name">Nombre</Label>
          <Input
            id="vcat-name"
            placeholder="Ej. Salón, Catering, Música"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <ErrorBanner message={error} />
        <Button type="submit" disabled={!name} isLoading={isSaving}>
          Crear categoría
        </Button>
      </form>
    </Modal>
  );
}

function OptionsModal({
  eventId,
  category,
  onClose,
  onChanged,
}: {
  eventId: string;
  category: VendorCategoryRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [options, setOptions] = useState<VendorOptionRow[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategorySummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOption, setEditingOption] = useState<VendorOptionRow | null>(null);
  const [deletingOption, setDeletingOption] = useState<VendorOptionRow | null>(null);
  const [convertingOption, setConvertingOption] = useState<VendorOptionRow | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [opts, summaries] = await Promise.all([
          fetchVendorOptions(category.id),
          fetchCategorySummaries(eventId),
        ]);
        setOptions(opts);
        setBudgetCategories(summaries);
      } catch (e) {
        setError(`No se pudieron cargar las cotizaciones: ${(e as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [category.id, eventId]);

  async function handleSelect(option: VendorOptionRow) {
    await selectVendorOption(option.id, category.id);
    setOptions((prev) =>
      prev.map((o) => ({
        ...o,
        status: o.id === option.id ? "selected" : o.status === "selected" ? "candidate" : o.status,
      }))
    );
    onChanged();
  }

  async function handleDelete() {
    if (!deletingOption) return;
    await deleteVendorOption(deletingOption.id);
    setOptions((prev) => prev.filter((o) => o.id !== deletingOption.id));
    setDeletingOption(null);
    onChanged();
  }

  return (
    <Modal title={category.name} onClose={onClose}>
      <div className="mb-4 flex justify-end">
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          + Cotización
        </Button>
      </div>

      <ErrorBanner message={error} />

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : options.length === 0 ? (
        <EmptyState icon="📋" title="Sin cotizaciones aún" />
      ) : (
        <ul className="flex flex-col gap-3">
          {options.map((option) => (
            <li key={option.id} className="rounded-xl border border-hairline p-3">
              <div className="flex items-start justify-between gap-2">
                <button className="text-left" onClick={() => setEditingOption(option)}>
                  <p className="font-medium text-charcoal">{option.vendor_name}</p>
                  {option.price != null && (
                    <p className="text-sm text-muted">{formatCurrency(option.price)}</p>
                  )}
                  {option.what_is_included && (
                    <p className="mt-1 text-xs text-muted">{option.what_is_included}</p>
                  )}
                </button>
                <VendorStatusChip status={option.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {option.status !== "selected" && (
                  <button
                    onClick={() => handleSelect(option)}
                    className="rounded-full bg-warm/20 px-2.5 py-1 text-xs font-medium text-warm hover:bg-warm/30"
                  >
                    Elegir
                  </button>
                )}
                {option.status === "selected" && (
                  <button
                    onClick={() => setConvertingOption(option)}
                    className="rounded-full bg-sage/20 px-2.5 py-1 text-xs font-medium text-sage-dark hover:bg-sage/30"
                  >
                    Convertir en gasto
                  </button>
                )}
                <button
                  onClick={() => setDeletingOption(option)}
                  className="rounded-full px-2.5 py-1 text-xs text-muted hover:bg-declined/15 hover:text-declined"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(showForm || editingOption) && (
        <OptionFormModal
          eventId={eventId}
          categoryId={category.id}
          option={editingOption}
          onClose={() => {
            setShowForm(false);
            setEditingOption(null);
          }}
          onSaved={(option) => {
            setOptions((prev) => {
              const exists = prev.some((o) => o.id === option.id);
              return exists ? prev.map((o) => (o.id === option.id ? option : o)) : [...prev, option];
            });
            setShowForm(false);
            setEditingOption(null);
            onChanged();
          }}
        />
      )}

      {deletingOption && (
        <ConfirmDialog
          title="Eliminar cotización"
          message={`¿Eliminar "${deletingOption.vendor_name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingOption(null)}
        />
      )}

      {convertingOption && (
        <ConvertToExpenseModal
          eventId={eventId}
          option={convertingOption}
          budgetCategories={budgetCategories}
          onClose={() => setConvertingOption(null)}
          onConverted={() => {
            setConvertingOption(null);
            onChanged();
          }}
        />
      )}
    </Modal>
  );
}

function OptionFormModal({
  eventId,
  categoryId,
  option,
  onClose,
  onSaved,
}: {
  eventId: string;
  categoryId: string;
  option: VendorOptionRow | null;
  onClose: () => void;
  onSaved: (option: VendorOptionRow) => void;
}) {
  const [vendorName, setVendorName] = useState(option?.vendor_name ?? "");
  const [price, setPrice] = useState(option?.price != null ? String(option.price) : "");
  const [whatIsIncluded, setWhatIsIncluded] = useState(option?.what_is_included ?? "");
  const [contactName, setContactName] = useState(option?.contact_name ?? "");
  const [contactPhone, setContactPhone] = useState(option?.contact_phone ?? "");
  const [contactEmail, setContactEmail] = useState(option?.contact_email ?? "");
  const [notes, setNotes] = useState(option?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        vendor_name: vendorName,
        price: price ? Number(price.replace(/,/g, "")) : null,
        what_is_included: whatIsIncluded || null,
        contact_name: contactName || null,
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
        notes: notes || null,
      };
      const saved = option
        ? await updateVendorOption(option.id, payload)
        : await createVendorOption({ event_id: eventId, vendor_category_id: categoryId, ...payload });
      onSaved(saved);
    } catch (e) {
      setError(`No se pudo guardar: ${(e as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={option ? "Editar cotización" : "Nueva cotización"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="opt-name">Proveedor</Label>
          <Input id="opt-name" value={vendorName} onChange={(e) => setVendorName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="opt-price">Precio</Label>
          <Input id="opt-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="opt-included">Qué incluye</Label>
          <Textarea
            id="opt-included"
            rows={2}
            value={whatIsIncluded}
            onChange={(e) => setWhatIsIncluded(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="opt-contact">Contacto</Label>
            <Input id="opt-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="opt-phone">Teléfono</Label>
            <Input id="opt-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="opt-email">Correo</Label>
          <Input id="opt-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="opt-notes">Notas</Label>
          <Textarea id="opt-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <ErrorBanner message={error} />
        <Button type="submit" disabled={!vendorName} isLoading={isSaving}>
          {option ? "Guardar cambios" : "Agregar cotización"}
        </Button>
      </form>
    </Modal>
  );
}

function ConvertToExpenseModal({
  eventId,
  option,
  budgetCategories,
  onClose,
  onConverted,
}: {
  eventId: string;
  option: VendorOptionRow;
  budgetCategories: BudgetCategorySummaryRow[];
  onClose: () => void;
  onConverted: () => void;
}) {
  const [budgetCategoryId, setBudgetCategoryId] = useState(
    budgetCategories[0]?.budget_category_id ?? ""
  );
  const [expenseDate, setExpenseDate] = useState(todaySqlDate());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCategories = useMemo(() => budgetCategories.length > 0, [budgetCategories]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!budgetCategoryId) return;
    setIsSaving(true);
    setError(null);
    try {
      await createExpense({
        event_id: eventId,
        budget_category_id: budgetCategoryId,
        vendor_option_id: option.id,
        description: option.vendor_name,
        amount: option.price ?? 0,
        expense_date: expenseDate,
      });
      onConverted();
    } catch (e) {
      setError(`No se pudo convertir en gasto: ${(e as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title="Convertir en gasto" onClose={onClose}>
      {!hasCategories ? (
        <EmptyState
          icon="💰"
          title="Sin categorías de presupuesto"
          subtitle="Crea una categoría en Presupuesto antes de convertir esta cotización en gasto."
        />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="conv-category">Categoría de presupuesto</Label>
            <Select
              id="conv-category"
              value={budgetCategoryId}
              onChange={(e) => setBudgetCategoryId(e.target.value)}
            >
              {budgetCategories.map((c) => (
                <option key={c.budget_category_id} value={c.budget_category_id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="conv-date">Fecha del gasto</Label>
            <Input
              id="conv-date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />
          </div>
          <ErrorBanner message={error} />
          <Button type="submit" isLoading={isSaving}>
            Crear gasto por {formatCurrency(option.price ?? 0)}
          </Button>
        </form>
      )}
    </Modal>
  );
}
