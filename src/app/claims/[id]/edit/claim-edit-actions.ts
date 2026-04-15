"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ClaimEditState = { success?: boolean; message?: string };

const Schema = z.object({
  reportId: z.string().uuid(),
  category: z.enum(["pipe_burst", "appliance_leak", "human_error", "roof_leak", "unknown"]).optional(),
  habitability_status: z.enum(["fully_habitable", "limited", "uninhabitable"]).optional(),
  estimated_amount: z.coerce.number().positive().optional(),
  description: z.string().max(5000).optional(),
  reported_cause: z.string().max(2000).optional(),
  building_insurer_name: z.string().max(200).optional(),
  building_policy_number: z.string().max(100).optional(),
  contents_insurer_name: z.string().max(200).optional(),
  contents_policy_number: z.string().max(100).optional(),
  liability_insurer_name: z.string().max(200).optional(),
});

export async function updateClaimAction(
  _prev: ClaimEditState,
  formData: FormData,
): Promise<ClaimEditState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Ungültige Eingabe." };
  }

  const { reportId, ...updates } = parsed.data;
  const admin = createAdminClient();

  // Ownership prüfen
  const { data: claim } = await admin
    .from("damage_reports")
    .select("id, owner_id")
    .eq("id", reportId)
    .maybeSingle();

  if (!claim || claim.owner_id !== user.id) {
    return { success: false, message: "Keine Berechtigung." };
  }

  const payload: Record<string, string | number | null | undefined> = {};
  if (updates.category) payload.category = updates.category;
  if (updates.habitability_status) payload.habitability_status = updates.habitability_status;
  if (updates.estimated_amount) payload.estimated_amount = updates.estimated_amount;
  payload.description = updates.description || null;
  payload.reported_cause = updates.reported_cause || null;
  payload.building_insurer_name = updates.building_insurer_name || null;
  payload.building_policy_number = updates.building_policy_number || null;
  payload.contents_insurer_name = updates.contents_insurer_name || null;
  payload.contents_policy_number = updates.contents_policy_number || null;
  payload.liability_insurer_name = updates.liability_insurer_name || null;

  const { error } = await admin
    .from("damage_reports")
    .update(payload as never)
    .eq("id", reportId);

  if (error) return { success: false, message: error.message };

  await admin.from("activity_feed").insert({
    report_id: reportId,
    actor_id: user.id,
    actor_role: "owner",
    event_type: "note_added",
    note: "Schaden-Details aktualisiert",
  });

  revalidatePath(`/claims/${reportId}`);
  revalidatePath(`/claims/${reportId}/edit`);
  return { success: true };
}
