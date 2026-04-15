"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AppointmentState = { success?: boolean; message?: string };

const Schema = z.object({
  assignmentId: z.string().uuid(),
  scheduled_start: z.string().min(1, "Datum erforderlich"),
  scheduled_end: z.string().optional(),
});

export async function scheduleAppointmentAction(
  _prev: AppointmentState,
  formData: FormData,
): Promise<AppointmentState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Ungültiges Datum." };
  }

  const { assignmentId, scheduled_start, scheduled_end } = parsed.data;
  const admin = createAdminClient();

  // Nur Sanierer darf seinen eigenen Auftrag terminieren
  const { data: assignment } = await admin
    .from("assignments")
    .select("id, report_id, sanierer_id")
    .eq("id", assignmentId)
    .eq("sanierer_id", user.id)
    .maybeSingle();

  if (!assignment) return { success: false, message: "Kein Auftrag gefunden." };

  const { error } = await admin
    .from("assignments")
    .update({
      scheduled_start,
      scheduled_end: scheduled_end || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assignmentId);

  if (error) return { success: false, message: error.message };

  await admin.from("activity_feed").insert({
    report_id: assignment.report_id,
    actor_id: user.id,
    actor_role: "sanierer",
    event_type: "status_changed",
    note: `Termin festgelegt: ${new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(scheduled_start))}`,
  });

  revalidatePath("/dashboard/sanierer");
  return { success: true, message: "Termin gespeichert." };
}
