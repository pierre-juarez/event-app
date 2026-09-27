// Tipos que reflejan el esquema de supabase/migrations/*.sql — nombres de
// columna en snake_case tal como los devuelve supabase-js (sin capa extra de
// mapeo a camelCase).

export type RsvpStatus = "pending" | "confirmed" | "declined";
export type VendorOptionStatus = "candidate" | "selected" | "discarded";

export interface EventRow {
  id: string;
  owner_id: string;
  title: string;
  event_date: string;
  venue_name: string | null;
  venue_address: string | null;
  total_budget: number;
  notes: string | null;
  /** Token público para el link de confirmación de WhatsApp (sin login). */
  share_token: string;
  created_at: string;
  updated_at: string;
}

export interface GuestCategoryRow {
  id: string;
  event_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface GuestRow {
  id: string;
  event_id: string;
  full_name: string;
  rsvp_status: RsvpStatus;
  plus_ones: number;
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
  sort_order: number;
  category_id: string | null;
  /** null = todavía sin responder; se llena vía el link público de invite. */
  whatsapp_invite_ok: boolean | null;
  whatsapp_invite_responded_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Fila mínima que expone `public_guest_whatsapp_list` (sin datos sensibles). */
export interface PublicGuestWhatsappRow {
  id: string;
  full_name: string;
  plus_ones: number;
  whatsapp_invite_ok: boolean | null;
}

export interface TaskRow {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  assignee: string | null;
  category: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategoryRow {
  id: string;
  event_id: string;
  name: string;
  planned_amount: number;
  sort_order: number;
  created_at: string;
}

/** Refleja la vista `budget_category_summary` (planeado vs. gastado vs. restante). */
export interface BudgetCategorySummaryRow {
  budget_category_id: string;
  event_id: string;
  name: string;
  planned_amount: number;
  spent_amount: number;
  remaining_amount: number;
}

export interface ExpenseRow {
  id: string;
  event_id: string;
  budget_category_id: string | null;
  vendor_option_id: string | null;
  description: string;
  amount: number;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

export interface VendorCategoryRow {
  id: string;
  event_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface VendorOptionRow {
  id: string;
  event_id: string;
  vendor_category_id: string;
  vendor_name: string;
  price: number | null;
  what_is_included: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
  status: VendorOptionStatus;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItineraryItemRow {
  id: string;
  event_id: string;
  start_time: string;
  activity: string;
  notes: string | null;
  sort_order: number;
  created_at: string;
}
