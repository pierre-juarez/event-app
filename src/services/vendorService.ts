import { supabase } from "@/lib/supabase";
import type { VendorCategoryRow, VendorOptionRow, VendorOptionStatus } from "@/lib/types";

export interface VendorCategoryInput {
  event_id: string;
  name: string;
  sort_order?: number;
}

export interface VendorOptionInput {
  event_id: string;
  vendor_category_id: string;
  vendor_name: string;
  price?: number | null;
  what_is_included?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  notes?: string | null;
  status?: VendorOptionStatus;
}

export type VendorOptionUpdate = Partial<
  Omit<VendorOptionInput, "event_id" | "vendor_category_id">
>;

export async function fetchVendorCategories(eventId: string): Promise<VendorCategoryRow[]> {
  const { data, error } = await supabase
    .from("vendor_categories")
    .select()
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as VendorCategoryRow[];
}

export async function createVendorCategory(
  input: VendorCategoryInput
): Promise<VendorCategoryRow> {
  const { data, error } = await supabase
    .from("vendor_categories")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as VendorCategoryRow;
}

export async function deleteVendorCategory(id: string): Promise<void> {
  const { error } = await supabase.from("vendor_categories").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchVendorOptions(categoryId: string): Promise<VendorOptionRow[]> {
  const { data, error } = await supabase
    .from("vendor_options")
    .select()
    .eq("vendor_category_id", categoryId)
    .order("price", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data as VendorOptionRow[];
}

/** Todas las cotizaciones del evento, para el resumen por categoría. */
export async function fetchAllVendorOptions(eventId: string): Promise<VendorOptionRow[]> {
  const { data, error } = await supabase
    .from("vendor_options")
    .select()
    .eq("event_id", eventId);
  if (error) throw error;
  return data as VendorOptionRow[];
}

export async function createVendorOption(input: VendorOptionInput): Promise<VendorOptionRow> {
  const { data, error } = await supabase
    .from("vendor_options")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as VendorOptionRow;
}

export async function updateVendorOption(
  id: string,
  patch: VendorOptionUpdate
): Promise<VendorOptionRow> {
  const { data, error } = await supabase
    .from("vendor_options")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as VendorOptionRow;
}

export async function deleteVendorOption(id: string): Promise<void> {
  const { error } = await supabase.from("vendor_options").delete().eq("id", id);
  if (error) throw error;
}

/** Marca `id` como elegido y regresa el resto de la categoría a "candidate". */
export async function selectVendorOption(id: string, vendorCategoryId: string): Promise<void> {
  const { error: releaseError } = await supabase
    .from("vendor_options")
    .update({ status: "candidate" })
    .eq("vendor_category_id", vendorCategoryId)
    .eq("status", "selected");
  if (releaseError) throw releaseError;

  const { error } = await supabase
    .from("vendor_options")
    .update({ status: "selected" })
    .eq("id", id);
  if (error) throw error;
}
