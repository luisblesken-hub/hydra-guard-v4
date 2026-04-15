"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Note = { id: string; note: string | null; actor_role: string | null; created_at: string };
type NoteState = { success?: boolean; message?: string; newNote?: Note };

const Schema = z.object({
  reportId: z.string().uuid(),
  note: z.string().min(1).max(500),
});

export async function addClaimNoteAction(
  _prev: NoteState,
  formData: FormData,
): Promise<NoteState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Ungültige Eingabe." };
  }

  const { reportId, note } = parsed.data;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profile?.role as string | null) ?? null;

  const { data, error } = await admin
    .from("activity_feed")
    .insert({
      report_id: reportId,
      actor_id: user.id,
      actor_role: role,
      event_type: "note_added",
      note,
    })
    .select("id, note, actor_role, created_at")
    .single();

  if (error || !data) {
    return { success: false, message: error?.message ?? "Fehler beim Speichern." };
  }

  return {
    success: true,
    message: "",
    newNote: data as Note,
  };
}
