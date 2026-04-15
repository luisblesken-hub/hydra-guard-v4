"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SaniererProfileState = { success?: boolean; message?: string };

const Schema = z.object({
  userId: z.string().uuid(),
  availability_status: z.enum(["available", "busy", "unavailable"]),
  radius_km: z.coerce.number().min(1).max(500).default(50),
  specializations: z.union([z.string(), z.array(z.string())]).transform(
    (v) => (Array.isArray(v) ? v : [v])
  ).optional().default([]),
});

export async function saveSaniererProfileAction(
  _prev: SaniererProfileState,
  formData: FormData,
): Promise<SaniererProfileState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  const raw = {
    userId: formData.get("userId"),
    availability_status: formData.get("availability_status"),
    radius_km: formData.get("radius_km"),
    specializations: formData.getAll("specializations"),
  };

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: "Ungültige Eingabe." };
  }

  const { userId, availability_status, radius_km, specializations } = parsed.data;

  if (userId !== user.id) return { success: false, message: "Keine Berechtigung." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("sanierer_pool_profiles")
    .upsert(
      {
        profile_id: user.id,
        availability_status,
        radius_km,
        specializations,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" }
    );

  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/sanierer/einstellungen");
  return { success: true, message: "Profil gespeichert." };
}
