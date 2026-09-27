import { supabase } from "@/lib/supabase";
import type { BudgetCategoryRow, BudgetCategorySummaryRow, ExpenseRow } from "@/lib/types";

export interface BudgetCategoryInput {
  event_id: string;
  name: string;
  planned_amount: number;
  sort_order?: number;
}

export type BudgetCategoryUpdate = Partial<Omit<BudgetCategoryInput, "event_id">>;

export interface ExpenseInput {
  event_id: string;
  budget_category_id?: string | null;
  vendor_option_id?: string | null;
  description: string;
  amount: number;
  expense_date: string;
}

export type ExpenseUpdate = Partial<Omit<ExpenseInput, "event_id">>;

export async function fetchCategorySummaries(
  eventId: string
): Promise<BudgetCategorySummaryRow[]> {
  const { data, error } = await supabase
    .from("budget_category_summary")
    .select()
    .eq("event_id", eventId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data as BudgetCategorySummaryRow[];
}

export async function createBudgetCategory(
  input: BudgetCategoryInput
): Promise<BudgetCategoryRow> {
  const { data, error } = await supabase
    .from("budget_categories")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as BudgetCategoryRow;
}

export async function updateBudgetCategory(
  id: string,
  patch: BudgetCategoryUpdate
): Promise<BudgetCategoryRow> {
  const { data, error } = await supabase
    .from("budget_categories")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as BudgetCategoryRow;
}

export async function deleteBudgetCategory(id: string): Promise<void> {
  const { error } = await supabase.from("budget_categories").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchExpenses(categoryId: string): Promise<ExpenseRow[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select()
    .eq("budget_category_id", categoryId)
    .order("expense_date", { ascending: false });
  if (error) throw error;
  return data as ExpenseRow[];
}

export async function fetchAllExpenses(eventId: string): Promise<ExpenseRow[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select()
    .eq("event_id", eventId)
    .order("expense_date", { ascending: false });
  if (error) throw error;
  return data as ExpenseRow[];
}

export async function createExpense(input: ExpenseInput): Promise<ExpenseRow> {
  const { data, error } = await supabase
    .from("expenses")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as ExpenseRow;
}

export async function updateExpense(id: string, patch: ExpenseUpdate): Promise<ExpenseRow> {
  const { data, error } = await supabase
    .from("expenses")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ExpenseRow;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}
