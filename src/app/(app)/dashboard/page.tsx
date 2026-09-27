"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useEvent } from "@/contexts/EventContext";
import { fetchGuests } from "@/services/guestService";
import { fetchTasks } from "@/services/taskService";
import { fetchCategorySummaries } from "@/services/budgetService";
import type { GuestRow, TaskRow, BudgetCategorySummaryRow } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { BudgetProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

function attendeeCount(guests: GuestRow[], status: GuestRow["rsvp_status"]): number {
  return guests
    .filter((g) => g.rsvp_status === status)
    .reduce((sum, g) => sum + 1 + g.plus_ones, 0);
}

export default function DashboardPage() {
  const { event } = useEvent();
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [summaries, setSummaries] = useState<BudgetCategorySummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!event) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [g, t, s] = await Promise.all([
          fetchGuests(event.id),
          fetchTasks(event.id),
          fetchCategorySummaries(event.id),
        ]);
        if (cancelled) return;
        setGuests(g);
        setTasks(t);
        setSummaries(s);
      } catch (e) {
        if (!cancelled) setError(`No se pudo cargar el resumen: ${(e as Error).message}`);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [event]);

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.is_completed)
        .sort((a, b) => (a.due_date ?? "9999") < (b.due_date ?? "9999") ? -1 : 1)
        .slice(0, 3),
    [tasks]
  );

  const totalPlanned = summaries.reduce((sum, s) => sum + s.planned_amount, 0);
  const totalSpent = summaries.reduce((sum, s) => sum + s.spent_amount, 0);

  if (!event) return null;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title={event.title}
        subtitle={`${formatDateTime(event.event_date)}${event.venue_name ? ` · ${event.venue_name}` : ""}`}
      />

      <ErrorBanner message={error} />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <p className="text-2xl font-semibold text-confirmed">
                {attendeeCount(guests, "confirmed")}
              </p>
              <p className="text-xs text-muted">Confirmados</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-semibold text-pending">
                {attendeeCount(guests, "pending")}
              </p>
              <p className="text-xs text-muted">Pendientes</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-semibold text-declined">
                {attendeeCount(guests, "declined")}
              </p>
              <p className="text-xs text-muted">No asisten</p>
            </Card>
          </div>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium text-charcoal">Presupuesto</h2>
              <Link href="/budget" className="text-sm font-medium text-sage-dark">
                Ver todo
              </Link>
            </div>
            {summaries.length === 0 ? (
              <p className="text-sm text-muted">Aún no tienes categorías de presupuesto.</p>
            ) : (
              <>
                <p className="mb-2 text-sm text-muted">
                  {formatCurrency(totalSpent)} de {formatCurrency(totalPlanned)} planeado
                </p>
                <BudgetProgressBar planned={totalPlanned} spent={totalSpent} hideAmountLabel />
              </>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium text-charcoal">Próximas tareas</h2>
              <Link href="/tasks" className="text-sm font-medium text-sage-dark">
                Ver todas
              </Link>
            </div>
            {upcomingTasks.length === 0 ? (
              <EmptyState icon="✅" title="Sin tareas pendientes" />
            ) : (
              <ul className="flex flex-col divide-y divide-hairline">
                {upcomingTasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-charcoal">{task.title}</span>
                    <span className="text-xs text-muted">{formatDate(task.due_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
