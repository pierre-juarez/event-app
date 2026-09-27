"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useEvent } from "@/contexts/EventContext";
import {
  createBudgetCategory,
  createExpense,
  deleteBudgetCategory,
  deleteExpense,
  fetchCategorySummaries,
  fetchExpenses,
  updateBudgetCategory,
  updateExpense,
} from "@/services/budgetService";
import type { BudgetCategorySummaryRow, ExpenseRow } from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Spinner } from "@/components/ui/Spinner";
import { BudgetProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency, formatDate, todaySqlDate } from "@/lib/format";

export default function BudgetPage() {
  const { event } = useEvent();
  const [summaries, setSummaries] = useState<BudgetCategorySummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategorySummaryRow | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<BudgetCategorySummaryRow | null>(null);
  const [openCategory, setOpenCategory] = useState<BudgetCategorySummaryRow | null>(null);

  async function load() {
    if (!event) return;
    setIsLoading(true);
    setError(null);
    try {
      setSummaries(await fetchCategorySummaries(event.id));
    } catch (e) {
      setError(`No se pudo cargar el presupuesto: ${(e as Error).message}`);
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
    await deleteBudgetCategory(deletingCategory.budget_category_id);
    setDeletingCategory(null);
    await load();
  }

  const totalPlanned = summaries.reduce((sum, s) => sum + s.planned_amount, 0);
  const totalSpent = summaries.reduce((sum, s) => sum + s.spent_amount, 0);

  if (!event) return null;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Presupuesto"
        subtitle="Categorías, gastos y lo que resta"
        action={<Button onClick={() => setShowCategoryForm(true)}>+ Categoría</Button>}
      />

      <ErrorBanner message={error} />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : summaries.length === 0 ? (
        <EmptyState
          icon="💰"
          title="Sin categorías de presupuesto"
          subtitle="Crea categorías como Salón, Catering, Pastel…"
        />
      ) : (
        <>
          <Card>
            <p className="mb-2 text-sm text-muted">
              {formatCurrency(totalSpent)} de {formatCurrency(totalPlanned)} planeado
            </p>
            <BudgetProgressBar planned={totalPlanned} spent={totalSpent} hideAmountLabel />
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {summaries.map((summary) => (
              <Card key={summary.budget_category_id}>
                <button className="w-full text-left" onClick={() => setOpenCategory(summary)}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium text-charcoal">{summary.name}</h3>
                    <span className="text-xs text-muted">
                      {formatCurrency(summary.remaining_amount)} restante
                    </span>
                  </div>
                  <BudgetProgressBar planned={summary.planned_amount} spent={summary.spent_amount} />
                </button>
                <div className="mt-3 flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => setEditingCategory(summary)}
                    className="rounded-full px-2 py-1 text-muted hover:bg-sage-light"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeletingCategory(summary)}
                    className="rounded-full px-2 py-1 text-muted hover:bg-declined/15 hover:text-declined"
                  >
                    Eliminar
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {(showCategoryForm || editingCategory) && (
        <CategoryFormModal
          eventId={event.id}
          category={editingCategory}
          onClose={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
          onSaved={async () => {
            setShowCategoryForm(false);
            setEditingCategory(null);
            await load();
          }}
        />
      )}

      {deletingCategory && (
        <ConfirmDialog
          title="Eliminar categoría"
          message={`¿Eliminar "${deletingCategory.name}"? También se eliminarán sus gastos.`}
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeletingCategory(null)}
        />
      )}

      {openCategory && (
        <ExpensesModal
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
  category,
  onClose,
  onSaved,
}: {
  eventId: string;
  category: BudgetCategorySummaryRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [plannedAmount, setPlannedAmount] = useState(
    category ? String(category.planned_amount) : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const amount = Number(plannedAmount.replace(/,/g, "")) || 0;
      if (category) {
        await updateBudgetCategory(category.budget_category_id, { name, planned_amount: amount });
      } else {
        await createBudgetCategory({ event_id: eventId, name, planned_amount: amount });
      }
      onSaved();
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
          <Label htmlFor="cat-name">Nombre</Label>
          <Input
            id="cat-name"
            placeholder="Ej. Salón, Catering, Pastel"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="cat-planned">Monto planeado</Label>
          <Input
            id="cat-planned"
            inputMode="decimal"
            value={plannedAmount}
            onChange={(e) => setPlannedAmount(e.target.value)}
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

function ExpensesModal({
  eventId,
  category,
  onClose,
  onChanged,
}: {
  eventId: string;
  category: BudgetCategorySummaryRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRow | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseRow | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        setExpenses(await fetchExpenses(category.budget_category_id));
      } catch (e) {
        setError(`No se pudieron cargar los gastos: ${(e as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [category.budget_category_id]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  async function handleDelete() {
    if (!deletingExpense) return;
    await deleteExpense(deletingExpense.id);
    setExpenses((prev) => prev.filter((e) => e.id !== deletingExpense.id));
    setDeletingExpense(null);
    onChanged();
  }

  return (
    <Modal title={category.name} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">{formatCurrency(totalSpent)} gastado</p>
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          + Gasto
        </Button>
      </div>

      <ErrorBanner message={error} />

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState icon="🧾" title="Sin gastos registrados" />
      ) : (
        <ul className="flex flex-col divide-y divide-hairline">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-center justify-between py-2.5">
              <button className="text-left" onClick={() => setEditingExpense(expense)}>
                <p className="text-sm font-medium text-charcoal">{expense.description}</p>
                <p className="text-xs text-muted">{formatDate(expense.expense_date)}</p>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-charcoal">{formatCurrency(expense.amount)}</span>
                <button
                  onClick={() => setDeletingExpense(expense)}
                  className="rounded-full p-1 text-muted hover:bg-declined/15 hover:text-declined"
                  aria-label="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(showForm || editingExpense) && (
        <ExpenseFormModal
          eventId={eventId}
          categoryId={category.budget_category_id}
          expense={editingExpense}
          onClose={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
          onSaved={(expense) => {
            setExpenses((prev) => {
              const exists = prev.some((e) => e.id === expense.id);
              return exists ? prev.map((e) => (e.id === expense.id ? expense : e)) : [expense, ...prev];
            });
            setShowForm(false);
            setEditingExpense(null);
            onChanged();
          }}
        />
      )}

      {deletingExpense && (
        <ConfirmDialog
          title="Eliminar gasto"
          message={`¿Eliminar "${deletingExpense.description}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingExpense(null)}
        />
      )}
    </Modal>
  );
}

function ExpenseFormModal({
  eventId,
  categoryId,
  expense,
  onClose,
  onSaved,
}: {
  eventId: string;
  categoryId: string;
  expense: ExpenseRow | null;
  onClose: () => void;
  onSaved: (expense: ExpenseRow) => void;
}) {
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [expenseDate, setExpenseDate] = useState(expense?.expense_date ?? todaySqlDate());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const amountValue = Number(amount.replace(/,/g, "")) || 0;
      const saved = expense
        ? await updateExpense(expense.id, { description, amount: amountValue, expense_date: expenseDate })
        : await createExpense({
            event_id: eventId,
            budget_category_id: categoryId,
            description,
            amount: amountValue,
            expense_date: expenseDate,
          });
      onSaved(saved);
    } catch (e) {
      setError(`No se pudo guardar: ${(e as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={expense ? "Editar gasto" : "Nuevo gasto"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="exp-description">Descripción</Label>
          <Input
            id="exp-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="exp-amount">Monto</Label>
            <Input
              id="exp-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="exp-date">Fecha</Label>
            <Input
              id="exp-date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />
          </div>
        </div>
        <ErrorBanner message={error} />
        <Button type="submit" disabled={!description || !amount} isLoading={isSaving}>
          {expense ? "Guardar cambios" : "Agregar gasto"}
        </Button>
      </form>
    </Modal>
  );
}
