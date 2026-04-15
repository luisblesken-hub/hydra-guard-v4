"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type DispatcherState = {
  success?: boolean;
  message?: string;
};

const Schema = z.object({
  reportId: z.string().uuid(),
  saniererId: z.string().uuid(),
});

/**
 * Owner beauftragt einen Sanierer mit einem Schadenfall.
 * Erzeugt ein Assignment und setzt den Claim auf "dispatched".
 */
export async function assignSaniererAction(
  _prev: DispatcherState,
  formData: FormData,
): Promise<DispatcherState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Ungültige Eingabe." };
  }

  const { reportId, saniererId } = parsed.data;
  const admin = createAdminClient();

  // Owner-Check
  const { data: report } = await admin
    .from("damage_reports")
    .select("id, owner_id, status")
    .eq("id", reportId)
    .maybeSingle();

  if (!report || report.owner_id !== user.id) {
    return { success: false, message: "Keine Berechtigung." };
  }

  // Sanierer-Check (Rolle)
  const { data: profile } = await admin
    .from("profiles")
    .select("role, email")
    .eq("id", saniererId)
    .maybeSingle();
  if (profile?.role !== "sanierer") {
    return { success: false, message: "Nutzer ist kein Sanierer." };
  }

  // Existierendes Assignment prüfen
  const { data: existing } = await admin
    .from("assignments")
    .select("id")
    .eq("report_id", reportId)
    .eq("sanierer_id", saniererId)
    .maybeSingle();

  if (existing) {
    return { success: false, message: "Sanierer ist bereits zugewiesen." };
  }

  const { error } = await admin.from("assignments").insert({
    report_id: reportId,
    sanierer_id: saniererId,
    assigned_by: user.id,
    status: "pending",
  });

  if (error) return { success: false, message: error.message };

  // Status aktualisieren: approved/submitted → dispatched
  await admin
    .from("damage_reports")
    .update({ status: "dispatched" })
    .eq("id", reportId)
    .in("status", ["submitted", "validating", "reviewing", "approved"]);

  await admin.from("activity_feed").insert({
    report_id: reportId,
    actor_id: user.id,
    actor_role: "owner",
    event_type: "assignment_created",
    note: `Sanierer beauftragt${profile.email ? `: ${profile.email}` : ""}`,
  });

  revalidatePath(`/claims/${reportId}`);
  revalidatePath("/dashboard/owner");
  return { success: true, message: "Sanierer beauftragt." };
}
