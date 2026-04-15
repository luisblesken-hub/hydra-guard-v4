"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SampleClaimState = {
  success?: boolean;
  message?: string;
  claimId?: string;
};

/**
 * Admin-Only: Erzeugt einen Beispiel-Schadensfall inkl. Property und Assignment.
 */
export async function createSampleClaimAction(): Promise<SampleClaimState> {
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

  // Property anlegen (oder wiederverwenden)
  const { data: existing } = await admin
    .from("properties")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  let propertyId: string;
  if (existing) {
    propertyId = existing.id;
  } else {
    const { data: prop, error: propError } = await admin
      .from("properties")
      .insert({
        owner_id: user.id,
        label: "Demo-Objekt Aachen",
        street: "Demostraße " + Math.floor(Math.random() * 100 + 1),
        postal_code: "52062",
        city: "Aachen",
      })
      .select("id")
      .single();
    if (propError || !prop) return { success: false, message: propError?.message ?? "Property konnte nicht erstellt werden." };
    propertyId = prop.id;
  }

  const amounts = [1500, 2800, 4200, 6700, 9800];
  const categories = ["pipe_burst", "appliance_leak", "human_error", "roof_leak"];
  const causes = [
    "Rohrbruch unter der Badewanne festgestellt, Wasser stand ca. 1cm hoch.",
    "Waschmaschinenschlauch gelöst, Wasser hat den Küchenboden durchnässt.",
    "Heizungsrohr undicht, Heizkörperraum betroffen.",
    "Dachrinne verstopft, Wasser in der Dämmung.",
  ];
  const amount = amounts[Math.floor(Math.random() * amounts.length)];
  const category = categories[Math.floor(Math.random() * categories.length)] as
    | "pipe_burst"
    | "appliance_leak"
    | "human_error"
    | "roof_leak";
  const cause = causes[Math.floor(Math.random() * causes.length)];

  const { data: claim, error: claimError } = await admin
    .from("damage_reports")
    .insert({
      property_id: propertyId,
      owner_id: user.id,
      estimated_amount: amount,
      category,
      reported_cause: cause,
      description: "Automatisch generierter Beispiel-Schadensfall.",
      status: "submitted",
      habitability_status: "limited",
    })
    .select("id")
    .single();

  if (claimError || !claim) {
    return { success: false, message: claimError?.message ?? "Schadenfall konnte nicht erstellt werden." };
  }

  // Activity Feed
  await admin.from("activity_feed").insert({
    report_id: claim.id,
    actor_id: user.id,
    actor_role: "admin",
    event_type: "claim_created",
    note: `Beispiel-Schaden angelegt (${amount} €)`,
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/owner");
  return { success: true, message: `Schadenfall angelegt (${amount} €).`, claimId: claim.id };
}
