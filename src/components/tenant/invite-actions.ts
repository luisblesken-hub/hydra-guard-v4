"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export type InviteState = {
  success?: boolean;
  message?: string;
  invitationToken?: string;
};

const Schema = z.object({
  reportId: z.string().uuid(),
  email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben."),
});

/**
 * Owner lädt Mieter per E-Mail zum Schadenfall ein.
 * Erzeugt ein damage_invitations Eintrag mit eindeutigem Token.
 */
export async function inviteTenantAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message:
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "Ungültige Eingabe.",
    };
  }

  const { reportId, email } = parsed.data;
  const admin = createAdminClient();

  // Owner-Check
  const { data: report } = await admin
    .from("damage_reports")
    .select("id, owner_id")
    .eq("id", reportId)
    .maybeSingle();

  if (!report || report.owner_id !== user.id) {
    return { success: false, message: "Keine Berechtigung." };
  }

  // Prüfen ob Email bereits eingeladen
  const { data: existing } = await admin
    .from("damage_invitations")
    .select("id, token")
    .eq("report_id", reportId)
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return {
      success: true,
      message: "Diese E-Mail-Adresse ist bereits eingeladen.",
      invitationToken: existing.token,
    };
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 Tage gültig

  const { error } = await admin.from("damage_invitations").insert({
    report_id: reportId,
    email,
    token,
    invited_by: user.id,
    expires_at: expiresAt.toISOString(),
  });

  if (error) return { success: false, message: error.message };

  await admin.from("activity_feed").insert({
    report_id: reportId,
    actor_id: user.id,
    actor_role: "owner",
    event_type: "note_added",
    note: `Mieter eingeladen: ${email}`,
  });

  revalidatePath(`/claims/${reportId}`);
  return {
    success: true,
    message: "Einladung erstellt. Link kann kopiert werden.",
    invitationToken: token,
  };
}
