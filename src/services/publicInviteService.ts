import { supabase } from "@/lib/supabase";
import type { PublicGuestWhatsappRow } from "@/lib/types";

/**
 * Estas dos funciones llaman RPCs `security definer` (ver migración
 * 20260927000001) que no requieren sesión — el `share_token` del link es la
 * única credencial. No pasan por las políticas RLS normales, así que solo
 * exponen/mutan exactamente lo que la función SQL define (nombre + respuesta).
 */

export async function fetchPublicGuestWhatsappList(
  shareToken: string
): Promise<PublicGuestWhatsappRow[]> {
  const { data, error } = await supabase.rpc("public_guest_whatsapp_list", {
    p_share_token: shareToken,
  });
  if (error) throw error;
  return data as PublicGuestWhatsappRow[];
}

export async function setGuestWhatsappInvite(
  shareToken: string,
  guestId: string,
  canSend: boolean
): Promise<void> {
  const { error } = await supabase.rpc("public_set_guest_whatsapp_invite", {
    p_share_token: shareToken,
    p_guest_id: guestId,
    p_can_send: canSend,
  });
  if (error) throw error;
}
