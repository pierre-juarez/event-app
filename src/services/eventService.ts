import { supabase } from "@/lib/supabase";
import type { EventRow } from "@/lib/types";

export interface EventInput {
  owner_id: string;
  title: string;
  event_date: string;
  venue_name?: string | null;
  venue_address?: string | null;
  total_budget: number;
  notes?: string | null;
}

export type EventUpdate = Partial<Omit<EventInput, "owner_id">>;

/** El evento del usuario actual, o null si todavía no ha creado uno. */
export async function fetchCurrentEvent(): Promise<EventRow | null> {
  const { data, error } = await supabase
    .from("events")
    .select()
    .order("created_at", { ascending: true })
    .limit(1);
  if (error) throw error;
  return (data as EventRow[])[0] ?? null;
}

export async function createEvent(input: EventInput): Promise<EventRow> {
  const { data, error } = await supabase
    .from("events")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as EventRow;
}

export async function updateEvent(id: string, patch: EventUpdate): Promise<EventRow> {
  const { data, error } = await supabase
    .from("events")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as EventRow;
}
