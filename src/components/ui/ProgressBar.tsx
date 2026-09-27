import clsx from "clsx";
import { formatCurrency } from "@/lib/format";

export function BudgetProgressBar({
  planned,
  spent,
  hideAmountLabel = false,
}: {
  planned: number;
  spent: number;
  hideAmountLabel?: boolean;
}) {
  const ratio = planned > 0 ? spent / planned : spent > 0 ? 1 : 0;
  const percentage = Math.min(ratio, 1) * 100;
  const overBudget = spent > planned;

  return (
    <div>
      {!hideAmountLabel && (
        <div className="mb-1 flex items-center justify-between text-xs text-muted">
          <span>{formatCurrency(spent)} gastado</span>
          <span>{formatCurrency(planned)} planeado</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-sage-light">
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            overBudget ? "bg-declined" : "bg-sage"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
