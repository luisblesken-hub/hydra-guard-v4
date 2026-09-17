"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncClaimEstimateFromPhotos } from "@/lib/ai/aggregate-claim-from-photos";

export async function applyPhotoEstimateAction(claimId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Nicht authentifiziert." };

  const admin = createAdminClient();
  const { data: claim } = await admin
    .from("damage_reports")
    .select("id, owner_id")
    .eq("id", claimId)
    .maybeSingle();

  if (!claim) {
    return { success: false as const, error: "Schadenfall nicht gefunden." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profile?.role as string | null) ?? null;
  const isOwner = claim.owner_id === user.id;
  const isAdmin = role === "admin";
  if (!isOwner && !isAdmin) {
    return { success: false as const, error: "Keine Berechtigung." };
  }

  const estimate = await syncClaimEstimateFromPhotos(admin, claimId, { force: true });
  if (!estimate) {
    return { success: false as const, error: "Keine Foto-Analyse vorhanden." };
  }

  await admin.from("activity_feed").insert({
    report_id: claimId,
    actor_id: user.id,
    actor_role: isOwner ? "owner" : "admin",
    event_type: "note_added",
    note: `Schätzung aus Foto-Analyse übernommen (${estimate.suggested_amount_eur.toFixed(0)} €)`,
  });

  revalidatePath(`/claims/${claimId}`);
  revalidatePath("/claims");
  return { success: true as const, amount: estimate.suggested_amount_eur };
}
