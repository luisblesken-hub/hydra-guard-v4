"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DryingLogEntry } from "./drying-log-section";

export type DryingLogFormState = {
  success?: boolean;
  message?: string;
  entry?: DryingLogEntry;
};

const Schema = z.object({
  reportId: z.string().uuid(),
  moisture_percent: z.coerce
    .number()
    .min(0, "Messwert muss ≥ 0 sein.")
    .max(100, "Messwert muss ≤ 100 sein."),
  room_label: z.string().max(200).optional(),
  equipment_notes: z.string().max(2000).optional(),
});

export async function addDryingLogEntry(
  _prev: DryingLogFormState,
  formData: FormData
): Promise<DryingLogFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Nicht authentifiziert." };
  }

  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { success: false, message: first ?? "Ungültige Eingabe." };
  }

  const { reportId, moisture_percent, room_label, equipment_notes } =
    parsed.data;

  const admin = createAdminClient();

  // Verify the report belongs to this user
  const { data: report } = await admin
    .from("damage_reports")
    .select("id")
    .eq("id", reportId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!report) {
    return { success: false, message: "Schadenmeldung nicht gefunden." };
  }

  // Find or note absence of assignment — use report_id to look up
  const { data: assignment } = await admin
    .from("assignments")
    .select("id")
    .eq("report_id", reportId)
    .limit(1)
    .maybeSingle();

  if (!assignment) {
    // No assignment yet — create a placeholder so the log entry can be saved
    const { data: newAssignment, error: assignError } = await admin
      .from("assignments")
      .insert({
        report_id: reportId,
        sanierer_id: user.id,
        assigned_by: user.id,
        status: "pending",
      })
      .select("id")
      .single();

    if (assignError || !newAssignment) {
      return { success: false, message: "Auftrag konnte nicht erstellt werden." };
    }

    return insertEntry(admin, newAssignment.id, user.id, parsed.data);
  }

  return insertEntry(admin, assignment.id, user.id, parsed.data);
}

async function insertEntry(
  admin: ReturnType<typeof createAdminClient>,
  assignmentId: string,
  userId: string,
  input: { moisture_percent: number; room_label?: string; equipment_notes?: string }
): Promise<DryingLogFormState> {
  const { data, error } = await admin
    .from("drying_log_entries")
    .insert({
      assignment_id: assignmentId,
      recorded_by: userId,
      moisture_percent: input.moisture_percent,
      room_label: input.room_label || null,
      equipment_notes: input.equipment_notes || null,
    })
    .select("id, recorded_at, moisture_percent, room_label, equipment_notes")
    .single();

  if (error || !data) {
    console.error("[drying-log] insert error:", error?.code);
    return { success: false, message: "Eintrag konnte nicht gespeichert werden." };
  }

  // Activity Feed
  const { data: assignment } = await admin
    .from("assignments")
    .select("report_id")
    .eq("id", assignmentId)
    .maybeSingle();
  if (assignment) {
    await admin.from("activity_feed").insert({
      report_id: assignment.report_id,
      actor_id: userId,
      actor_role: "sanierer",
      event_type: "drying_log_added",
      note: `Messwert erfasst: ${input.moisture_percent}%${input.room_label ? ` · ${input.room_label}` : ""}`,
    });
  }

  return {
    success: true,
    entry: data as DryingLogEntry,
  };
}
