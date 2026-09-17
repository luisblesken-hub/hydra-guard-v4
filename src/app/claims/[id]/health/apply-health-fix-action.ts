"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { syncClaimEstimateFromPhotos } from "@/lib/ai/aggregate-claim-from-photos"
import { resolveClaimTier } from "@/lib/claims/tier"
import type { ClaimHealthFixAction } from "@/lib/ai/claim-health-types"

const InputSchema = z.object({
  claimId: z.string().uuid(),
  action: z.enum(["apply_photo_estimate", "align_claim_tier"]),
})

export type ApplyClaimHealthFixResult =
  | { success: true }
  | { success: false; error: string }

function actorRoleFor(role: string | null, isOwner: boolean): "owner" | "admin" {
  if (isOwner) return "owner"
  if (role === "admin") return "admin"
  return "owner"
}

export async function applyClaimHealthFixAction(
  claimId: string,
  action: ClaimHealthFixAction
): Promise<ApplyClaimHealthFixResult> {
  const parsed = InputSchema.safeParse({ claimId, action })
  if (!parsed.success) {
    return { success: false, error: "Ungültige Anfrage." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Nicht authentifiziert." }

  const admin = createAdminClient()
  const { data: claim } = await admin
    .from("damage_reports")
    .select("id, owner_id, estimated_amount, claim_tier")
    .eq("id", parsed.data.claimId)
    .maybeSingle()

  if (!claim) {
    return { success: false, error: "Schadenfall nicht gefunden." }
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const role = (profile?.role as string | null) ?? null
  const isOwner = claim.owner_id === user.id
  const isAdmin = role === "admin"
  if (!isOwner && !isAdmin) {
    return { success: false, error: "Keine Berechtigung." }
  }

  const actorRole = actorRoleFor(role, isOwner)

  if (parsed.data.action === "apply_photo_estimate") {
    const estimate = await syncClaimEstimateFromPhotos(admin, parsed.data.claimId, {
      force: true,
    })
    if (!estimate) {
      return { success: false, error: "Keine Foto-Analyse vorhanden." }
    }

    await admin.from("activity_feed").insert({
      report_id: parsed.data.claimId,
      actor_id: user.id,
      actor_role: actorRole,
      event_type: "note_added",
      note: `Systemprüfung: Schätzung aus Foto-Analyse übernommen (${estimate.suggested_amount_eur.toFixed(0)} €)`,
    })
  } else {
    const expectedTier = resolveClaimTier(Number(claim.estimated_amount ?? 0))
    if (claim.claim_tier === expectedTier) {
      return { success: false, error: "Track ist bereits konsistent." }
    }

    const { error: updErr } = await admin
      .from("damage_reports")
      .update({ claim_tier: expectedTier })
      .eq("id", parsed.data.claimId)

    if (updErr) {
      console.error("[applyClaimHealthFixAction] tier", updErr.code)
      return { success: false, error: "Track konnte nicht aktualisiert werden." }
    }

    const tierDe =
      expectedTier === "out_of_scope" ? "Gutachter-Track" : "Standard-Track"

    await admin.from("activity_feed").insert({
      report_id: parsed.data.claimId,
      actor_id: user.id,
      actor_role: actorRole,
      event_type: "note_added",
      note: `Systemprüfung: Track an Schätzung angeglichen (${tierDe})`,
    })
  }

  revalidatePath(`/claims/${parsed.data.claimId}`)
  revalidatePath("/claims")
  revalidatePath("/dashboard/owner")
  revalidatePath("/dashboard/admin")
  return { success: true }
}
