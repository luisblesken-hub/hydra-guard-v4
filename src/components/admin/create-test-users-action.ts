"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateTestUsersState = {
  success?: boolean;
  message?: string;
  created?: Array<{ email: string; role: string; password: string }>;
};

/**
 * Admin-Only: Erzeugt 3 Testnutzer (Sanierer, Versicherung, Mieter)
 * mit zufälligen Passwörtern für Smoke-Tests.
 */
export async function createTestUsersAction(): Promise<CreateTestUsersState> {
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
    return { success: false, message: "Nur Admins." };
  }

  const randomPass = () =>
    Math.random().toString(36).slice(2, 10) + "Aa1!";

  const testUsers = [
    { email: "sanierer@test.hydra.de", role: "sanierer" as const },
    { email: "insurer@test.hydra.de", role: "versicherung" as const },
    { email: "mieter@test.hydra.de", role: "mieter" as const },
  ];

  const created: CreateTestUsersState["created"] = [];

  for (const u of testUsers) {
    const password = randomPass();
    // Prüfen ob bereits existiert
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", u.email)
      .maybeSingle();

    if (existingProfile) {
      created.push({ email: u.email, role: u.role, password: "(bereits vorhanden)" });
      continue;
    }

    // Auth-User erzeugen
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: u.email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      created.push({ email: u.email, role: u.role, password: `FEHLER: ${authError?.message ?? "unbekannt"}` });
      continue;
    }

    // Profile upsert
    await admin.from("profiles").upsert(
      {
        id: authData.user.id,
        email: u.email,
        role: u.role,
      },
      { onConflict: "id" },
    );

    created.push({ email: u.email, role: u.role, password });
  }

  revalidatePath("/dashboard/admin");
  return { success: true, created };
}
