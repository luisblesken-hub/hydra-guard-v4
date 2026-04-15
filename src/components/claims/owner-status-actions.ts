"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type OwnerStatusState = { success?: boolean; message?: string };

const Schema = z.object({
  reportId: z.string().uuid(),
  newStatus: z.enum(["approved", "rejected", "dispatched", "closed"]),
});

/**
 * Owner ändert den Status eines Schadensfalls direkt.
 */
export async function ownerUpdateClaimStatusAction(
  reportId: string,
  newStatus: "approved" | "rejected" | "dispatched" | "closed",
): Promise<OwnerStatusState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  const admin = createAdminClient();
  const { data: report } = await admin
    .from("damage_reports")
    .select("id, owner_id, status")
    .eq("id", reportId)
    .maybeSingle();

  if (!report || report.owner_id !== user.id) {
    return { success: false, message: "Keine Berechtigung." };
  }

  const { error } = await admin
    .from("damage_reports")
    .update({ status: newStatus })
    .eq("id", reportId);

  if (error) return { success: false, message: error.message };

  const STATUS_LABEL: Record<string, string> = {
    approved: "freigegeben",
    rejected: "abgelehnt",
    dispatched: "beauftragt",
    closed: "archiviert",
  };

  await admin.from("activity_feed").insert({
    report_id: reportId,
    actor_id: user.id,
    actor_role: "owner",
    event_type: "status_changed",
    note: `Status auf "${STATUS_LABEL[newStatus] ?? newStatus}" geändert`,
  });

  revalidatePath(`/claims/${reportId}`);
  revalidatePath("/dashboard/owner");
  return { success: true, message: `Status aktualisiert.` };
}
