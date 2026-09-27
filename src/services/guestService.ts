import { supabase } from "@/lib/supabase";
import type { GuestRow, GuestCategoryRow, RsvpStatus } from "@/lib/types";

export interface GuestInput {
  event_id: string;
  full_name: string;
  rsvp_status: RsvpStatus;
  plus_ones: number;
  contact_phone?: string | null;
  contact_email?: string | null;
  notes?: string | null;
  sort_order?: number;
  category_id?: string | null;
}

export type GuestUpdate = Partial<
  Omit<GuestInput, "event_id" | "category_id">
>;

export interface GuestCategoryInput {
  event_id: string;
  name: string;
  sort_order?: number;
}

export type GuestCategoryUpdate = Partial<Omit<GuestCategoryInput, "event_id">>;

export async function fetchGuests(eventId: string): Promise<GuestRow[]> {
  const { data, error } = await supabase
    .from("guests")
    .select()
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("full_name", { ascending: true });
  if (error) throw error;
  return data as GuestRow[];
}

export async function createGuest(input: GuestInput): Promise<GuestRow> {
  const { data, error } = await supabase
    .from("guests")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as GuestRow;
}

export async function updateGuest(id: string, patch: GuestUpdate): Promise<GuestRow> {
  const { data, error } = await supabase
    .from("guests")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as GuestRow;
}

/** category_id === null viaja explícito (quitar categoría), a diferencia de updateGuest. */
export async function moveGuestToCategory(
  id: string,
  categoryId: string | null,
  sortOrder: number
): Promise<GuestRow> {
  const { data, error } = await supabase
    .from("guests")
    .update({ category_id: categoryId, sort_order: sortOrder })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as GuestRow;
}

export async function deleteGuest(id: string): Promise<void> {
  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchGuestCategories(eventId: string): Promise<GuestCategoryRow[]> {
  const { data, error } = await supabase
    .from("guest_categories")
    .select()
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as GuestCategoryRow[];
}

export async function createGuestCategory(
  input: GuestCategoryInput
): Promise<GuestCategoryRow> {
  const { data, error } = await supabase
    .from("guest_categories")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as GuestCategoryRow;
}

export async function updateGuestCategory(
  id: string,
  patch: GuestCategoryUpdate
): Promise<GuestCategoryRow> {
  const { data, error } = await supabase
    .from("guest_categories")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as GuestCategoryRow;
}

export async function deleteGuestCategory(id: string): Promise<void> {
  const { error } = await supabase.from("guest_categories").delete().eq("id", id);
  if (error) throw error;
}
