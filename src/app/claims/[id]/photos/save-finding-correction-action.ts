"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  loadFindingCorrections,
  syncClaimEstimateFromPhotos,
} from "@/lib/ai/aggregate-claim-from-photos"
import { isPhotoAnalysisResult } from "@/lib/ai/photo-analysis-types"
import type { FindingCorrectionActivityPayload } from "@/lib/ai/finding-correction-types"
import type { SupabaseClient } from "@supabase/supabase-js"

const Schema = z.object({
  claimId: z.string().uuid(),
  photoId: z.string().uuid().nullable().optional(),
  correctedDamageType: z.string().max(120).optional().nullable(),
  correctedAmountEur: z.coerce.number().positive().max(125_000).optional().nullable(),
  correctedSeverity: z
    .enum(["low", "medium", "high", "critical"])
    .optional()
    .nullable(),
  note: z.string().max(500).optional().nullable(),
  applyToClaimAmount: z.boolean().optional(),
})

export type SaveFindingCorrectionResult =
  | { success: true; suggestedAmount: number | null }
  | { success: false; error: string }

export async function saveFindingCorrectionAction(
  input: z.infer<typeof Schema>
): Promise<SaveFindingCorrectionResult> {
  const parsed = Schema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Ungültige Eingabe." }
  }

  const {
    claimId,
    photoId = null,
    correctedDamageType,
    correctedAmountEur,
    correctedSeverity,
    note,
    applyToClaimAmount,
  } = parsed.data

  if (
    !correctedDamageType?.trim() &&
    correctedAmountEur == null &&
    !correctedSeverity
  ) {
    return { success: false, error: "Bitte Typ oder Betrag korrigieren." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Nicht authentifiziert." }

  const admin = createAdminClient()
  const { data: claim } = await admin
    .from("damage_reports")
    .select("id, owner_id")
    .eq("id", claimId)
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

  let originalType: string | null = null
  let originalAmount: number | null = null

  if (photoId) {
    const { data: photo } = await admin
      .from("damage_photos")
      .select("id, report_id, ai_analysis")
      .eq("id", photoId)
      .maybeSingle()

    if (!photo || photo.report_id !== claimId) {
      return { success: false, error: "Foto gehört nicht zu diesem Fall." }
    }
    if (isPhotoAnalysisResult(photo.ai_analysis)) {
      originalType = photo.ai_analysis.damage_type
      originalAmount = photo.ai_analysis.suggested_amount_eur
    }
  } else {
    const estimate = await syncClaimEstimateFromPhotos(admin, claimId)
    if (estimate) {
      originalAmount = estimate.suggested_amount_eur
      originalType = estimate.summary_de
    }
  }

  const now = new Date().toISOString()
  const row = {
    report_id: claimId,
    photo_id: photoId,
    original_damage_type: originalType,
    original_amount_eur: originalAmount,
    corrected_damage_type: correctedDamageType?.trim() || null,
    corrected_amount_eur: correctedAmountEur ?? null,
    corrected_severity: correctedSeverity ?? null,
    note: note?.trim() || null,
    corrected_by: user.id,
    updated_at: now,
  }

  // Upsert: one correction per photo, one claim-level per report
  const db = admin as SupabaseClient
  let upsertError: { code?: string; message?: string } | null = null

  if (photoId) {
    const { data: existing } = await db
      .from("ai_finding_corrections")
      .select("id")
      .eq("photo_id", photoId)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await db
        .from("ai_finding_corrections")
        .update(row)
        .eq("id", existing.id)
      upsertError = error
    } else {
      const { error } = await db.from("ai_finding_corrections").insert(row)
      upsertError = error
    }
  } else {
    const { data: existing } = await db
      .from("ai_finding_corrections")
      .select("id")
      .eq("report_id", claimId)
      .is("photo_id", null)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await db
        .from("ai_finding_corrections")
        .update(row)
        .eq("id", existing.id)
      upsertError = error
    } else {
      const { error } = await db.from("ai_finding_corrections").insert(row)
      upsertError = error
    }
  }

  if (upsertError) {
    console.error("[saveFindingCorrectionAction]", upsertError.code)
    return {
      success: false,
      error:
        upsertError.code === "42P01"
          ? "Korrektur-Tabelle fehlt — Migration 0007 ausführen."
          : "Korrektur konnte nicht gespeichert werden.",
    }
  }

  const payload: FindingCorrectionActivityPayload = {
    kind: "ai_finding_correction",
    version: 1,
    scope: photoId ? "photo" : "claim",
    photo_id: photoId,
    original: { damage_type: originalType, amount_eur: originalAmount },
    corrected: {
      damage_type: correctedDamageType?.trim() || null,
      amount_eur: correctedAmountEur ?? null,
      severity: correctedSeverity ?? null,
    },
  }

  const parts: string[] = []
  if (correctedDamageType?.trim()) parts.push(`Typ → ${correctedDamageType.trim()}`)
  if (correctedAmountEur != null) {
    parts.push(`Betrag → ${correctedAmountEur.toLocaleString("de-DE")} €`)
  }

  await admin.from("activity_feed").insert({
    report_id: claimId,
    actor_id: user.id,
    actor_role: isOwner ? "owner" : "admin",
    event_type: "note_added",
    note: `System-Finding korrigiert (${photoId ? "Foto" : "Claim"}): ${parts.join(", ") || "—"}`,
    new_value: payload as never,
  })

  const shouldForce =
    Boolean(applyToClaimAmount) ||
    (!photoId && correctedAmountEur != null)

  const estimate = await syncClaimEstimateFromPhotos(admin, claimId, {
    force: shouldForce,
  })

  // Ensure claim-level amount correction writes even if aggregate is null
  if (shouldForce && correctedAmountEur != null && !photoId) {
    await admin
      .from("damage_reports")
      .update({ estimated_amount: correctedAmountEur })
      .eq("id", claimId)
  }

  revalidatePath(`/claims/${claimId}`)
  revalidatePath("/dashboard/owner")

  return {
    success: true,
    suggestedAmount: estimate?.suggested_amount_eur ?? correctedAmountEur ?? null,
  }
}

export async function getFindingCorrectionsAction(claimId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()
  return loadFindingCorrections(admin, claimId)
}
