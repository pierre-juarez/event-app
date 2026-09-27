import { supabase } from "@/lib/supabase";
import type { TaskRow } from "@/lib/types";

export interface TaskInput {
  event_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  assignee?: string | null;
  category?: string | null;
  is_completed?: boolean;
}

export type TaskUpdate = Partial<Omit<TaskInput, "event_id">>;

export async function fetchTasks(eventId: string): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select()
    .eq("event_id", eventId)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data as TaskRow[];
}

export async function createTask(input: TaskInput): Promise<TaskRow> {
  const { data, error } = await supabase
    .from("tasks")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as TaskRow;
}

export async function updateTask(id: string, patch: TaskUpdate): Promise<TaskRow> {
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as TaskRow;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
