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

  if (!claim || claim.owner_id !== user.id) {
    return { success: false as const, error: "Keine Berechtigung." };
  }

  const estimate = await syncClaimEstimateFromPhotos(admin, claimId, { force: true });
  if (!estimate) {
    return { success: false as const, error: "Keine Foto-Analyse vorhanden." };
  }

  await admin.from("activity_feed").insert({
    report_id: claimId,
    actor_id: user.id,
    actor_role: "owner",
    event_type: "note_added",
    note: `Schätzung aus Foto-Analyse übernommen (${estimate.suggested_amount_eur.toFixed(0)} €)`,
  });

  revalidatePath(`/claims/${claimId}`);
  revalidatePath("/claims");
  return { success: true as const, amount: estimate.suggested_amount_eur };
}
