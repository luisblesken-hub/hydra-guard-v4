"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserRoleState = {
  success?: boolean;
  message?: string;
};

const Schema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["owner", "sanierer", "versicherung", "mieter", "admin"]),
});

/**
 * Admin ändert die Rolle eines Nutzers.
 */
export async function updateUserRoleAction(
  userId: string,
  role: "owner" | "sanierer" | "versicherung" | "mieter" | "admin",
): Promise<UserRoleState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  const admin = createAdminClient();
  const { data: me } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "admin") {
    return { success: false, message: "Nur Admins dürfen Rollen ändern." };
  }

  const parsed = Schema.safeParse({ userId, role });
  if (!parsed.success) return { success: false, message: "Ungültige Eingabe." };

  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/admin");
  return { success: true, message: "Rolle aktualisiert." };
}
