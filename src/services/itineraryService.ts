import { supabase } from "@/lib/supabase";
import type { ItineraryItemRow } from "@/lib/types";

export interface ItineraryItemInput {
  event_id: string;
  start_time: string;
  activity: string;
  notes?: string | null;
  sort_order?: number;
}

export type ItineraryItemUpdate = Partial<Omit<ItineraryItemInput, "event_id">>;

export async function fetchItineraryItems(eventId: string): Promise<ItineraryItemRow[]> {
  const { data, error } = await supabase
    .from("itinerary_items")
    .select()
    .eq("event_id", eventId)
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as ItineraryItemRow[];
}

export async function createItineraryItem(
  input: ItineraryItemInput
): Promise<ItineraryItemRow> {
  const { data, error } = await supabase
    .from("itinerary_items")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as ItineraryItemRow;
}

export async function updateItineraryItem(
  id: string,
  patch: ItineraryItemUpdate
): Promise<ItineraryItemRow> {
  const { data, error } = await supabase
    .from("itinerary_items")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ItineraryItemRow;
}

export async function deleteItineraryItem(id: string): Promise<void> {
  const { error } = await supabase.from("itinerary_items").delete().eq("id", id);
  if (error) throw error;
}
