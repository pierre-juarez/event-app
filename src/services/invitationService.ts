import { supabase } from "@/lib/supabase";
import type { PublicInvitationRow } from "@/lib/types";

/**
 * RPCs `security definer` (migración 20261013000001) sin sesión: el
 * `invite_token` del link es la única credencial y solo toca la fila de ese
 * invitado.
 */

export async function fetchInvitation(inviteToken: string): Promise<PublicInvitationRow | null> {
  const { data, error } = await supabase.rpc("public_invitation_get", {
    p_invite_token: inviteToken,
  });
  if (error) throw error;
  return (data as PublicInvitationRow[])[0] ?? null;
}

export async function respondToInvitation(
  inviteToken: string,
  input: { attending: boolean; plusOnes: number; song: string }
): Promise<void> {
  const { error } = await supabase.rpc("public_invitation_respond", {
    p_invite_token: inviteToken,
    p_attending: input.attending,
    p_plus_ones: input.plusOnes,
    p_song: input.song,
  });
  if (error) throw error;
}
