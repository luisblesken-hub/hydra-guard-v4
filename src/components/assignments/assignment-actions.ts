"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AssignmentActionState = {
  success?: boolean;
  message?: string;
};

async function getSaniererRole(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role === "sanierer";
}

export async function updateAssignmentStatusAction(
  assignmentId: string,
  newStatus: "accepted" | "in_progress" | "completed",
): Promise<AssignmentActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  if (!(await getSaniererRole(user.id))) {
    return { success: false, message: "Keine Berechtigung." };
  }

  const admin = createAdminClient();

  // Sicherstellen dass Auftrag dem Sanierer gehört
  const { data: assignment } = await admin
    .from("assignments")
    .select("id, report_id, sanierer_id")
    .eq("id", assignmentId)
    .eq("sanierer_id", user.id)
    .maybeSingle();

  if (!assignment) return { success: false, message: "Auftrag nicht gefunden." };

  const { error } = await admin
    .from("assignments")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", assignmentId);

  if (error) return { success: false, message: error.message };

  // Schadenstatus mitziehen wenn in_progress/completed
  if (newStatus === "in_progress") {
    await admin
      .from("damage_reports")
      .update({ status: "in_remediation" })
      .eq("id", assignment.report_id)
      .in("status", ["dispatched", "approved"]);
  }

  const STATUS_LABEL: Record<string, string> = {
    accepted: "angenommen",
    in_progress: "in Arbeit",
    completed: "abgeschlossen",
  };

  await admin.from("activity_feed").insert({
    report_id: assignment.report_id,
    actor_id: user.id,
    actor_role: "sanierer",
    event_type: "status_changed",
    note: `Auftrag ${STATUS_LABEL[newStatus] ?? newStatus}`,
  });

  revalidatePath("/dashboard/sanierer");
  revalidatePath(`/claims/${assignment.report_id}`);
  return { success: true, message: `Status auf "${newStatus}" gesetzt.` };
}

const ConfirmedCauseSchema = z.object({
  assignmentId: z.string().uuid(),
  reportId: z.string().uuid(),
  confirmed_cause: z.string().min(3, "Mindestens 3 Zeichen.").max(2000),
});

export async function setConfirmedCauseAction(
  _prev: AssignmentActionState,
  formData: FormData,
): Promise<AssignmentActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  if (!(await getSaniererRole(user.id))) {
    return { success: false, message: "Nur Sanierer können die Ursache bestätigen." };
  }

  const parsed = ConfirmedCauseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "Ungültige Eingabe." };
  }

  const { assignmentId, reportId, confirmed_cause } = parsed.data;
  const admin = createAdminClient();

  // Auftragszugehörigkeit prüfen
  const { data: assignment } = await admin
    .from("assignments")
    .select("id")
    .eq("id", assignmentId)
    .eq("sanierer_id", user.id)
    .maybeSingle();

  if (!assignment) return { success: false, message: "Kein Auftrag gefunden." };

  const { error } = await admin
    .from("damage_reports")
    .update({ confirmed_cause })
    .eq("id", reportId);

  if (error) return { success: false, message: error.message };

  await admin.from("activity_feed").insert({
    report_id: reportId,
    actor_id: user.id,
    actor_role: "sanierer",
    event_type: "note_added",
    note: `Schadensursache bestätigt: ${confirmed_cause.slice(0, 200)}`,
  });

  revalidatePath("/dashboard/sanierer");
  revalidatePath(`/claims/${reportId}`);
  return { success: true, message: "Ursache bestätigt." };
}
