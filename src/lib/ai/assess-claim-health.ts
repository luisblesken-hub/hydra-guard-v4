// GDPR: Claim health uses structured case fields only. Never log photo bytes or URLs.

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  aggregatePhotoAnalyses,
} from "@/lib/ai/aggregate-claim-from-photos"
import { isPhotoAnalysisResult } from "@/lib/ai/photo-analysis-types"
import { OUT_OF_SCOPE_THRESHOLD, resolveClaimTier } from "@/lib/claims/tier"
import { statusLabel } from "@/lib/utils/claim-status"
import type {
  ClaimHealthFinding,
  ClaimHealthReport,
} from "@/lib/ai/claim-health-types"

type Client = SupabaseClient

export const PHOTO_DIVERGENCE_ABS_EUR = 100
export const PHOTO_DIVERGENCE_REL = 0.2

const SUBMITTED_PLUS = new Set([
  "submitted",
  "validating",
  "calculating",
  "reviewing",
  "approved",
  "dispatched",
  "in_remediation",
  "invoice_submitted",
  "invoice_approved",
  "closed",
  "rejected",
  "out_of_scope",
])

const DISPATCH_STATUSES = new Set(["dispatched", "in_remediation"])

const TIER_DE: Record<string, string> = {
  auto_track: "Standard-Track",
  expert_track: "Legacy-Experten-Track",
  out_of_scope: "Gutachter-Track",
}

function formatEur(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n)
}

function amountsDiverge(current: number, suggested: number): boolean {
  const absDiff = Math.abs(suggested - current)
  const pct = current > 0 ? absDiff / current : suggested > 0 ? 1 : 0
  return absDiff >= PHOTO_DIVERGENCE_ABS_EUR || pct >= PHOTO_DIVERGENCE_REL
}

function hasMelderTag(description: string | null): boolean {
  return /\[Melder:\s*[^\]]+\]/i.test(description ?? "")
}

function hasEinheitTag(description: string | null): boolean {
  return /\[Einheit:\s*[^\]]+\]/i.test(description ?? "")
}

export type ClaimHealthSnapshot = {
  id: string
  status: string
  claim_tier: string
  estimated_amount: number
  description: string | null
  reporter_id: string | null
  photoCount: number
  photoSuggestedAmount: number | null
  assignmentCount: number
  isTenantSubmitted: boolean
}

export function evaluateClaimHealth(snapshot: ClaimHealthSnapshot): ClaimHealthFinding[] {
  const findings: ClaimHealthFinding[] = []
  const amount = Number(snapshot.estimated_amount ?? 0)
  const expectedTier = resolveClaimTier(amount)

  if (
    snapshot.photoSuggestedAmount !== null &&
    amountsDiverge(amount, snapshot.photoSuggestedAmount)
  ) {
    const suggested = snapshot.photoSuggestedAmount
    const absDiff = Math.abs(suggested - amount)
    findings.push({
      code: "PHOTO_ESTIMATE_DIVERGENCE",
      severity: "warn",
      message_de:
        `System hat gefunden: Die Foto-Schätzung (${formatEur(suggested)}) weicht von der ` +
        `gespeicherten Schätzung (${formatEur(amount)}) um ${formatEur(absDiff)} ab.`,
      suggestedFix: {
        action: "apply_photo_estimate",
        payload: { suggested_amount_eur: suggested },
      },
    })
  }

  if (DISPATCH_STATUSES.has(snapshot.status) && snapshot.assignmentCount < 1) {
    findings.push({
      code: "STATUS_WITHOUT_ASSIGNMENT",
      severity: "error",
      message_de:
        `System hat gefunden: Status ist „${statusLabel(snapshot.status)}“, ` +
        `aber es ist kein Sanierer zugewiesen.`,
    })
  }

  if (snapshot.claim_tier !== expectedTier) {
    findings.push({
      code: "TIER_AMOUNT_MISMATCH",
      severity: "warn",
      message_de:
        `System hat gefunden: Track (${TIER_DE[snapshot.claim_tier] ?? snapshot.claim_tier}) ` +
        `passt nicht zur Schätzung (${formatEur(amount)}). ` +
        `Erwartet: ${TIER_DE[expectedTier]}.`,
      suggestedFix: {
        action: "align_claim_tier",
        payload: { claim_tier: expectedTier },
      },
    })
  }

  if (snapshot.status === "out_of_scope" && expectedTier === "auto_track") {
    findings.push({
      code: "STATUS_SCOPE_MISMATCH",
      severity: "warn",
      message_de:
        `System hat gefunden: Status ist „${statusLabel("out_of_scope")}“, ` +
        `die Schätzung liegt aber unter ${formatEur(OUT_OF_SCOPE_THRESHOLD)} (Standard-Track).`,
    })
  }

  if (SUBMITTED_PLUS.has(snapshot.status) && snapshot.photoCount < 1) {
    findings.push({
      code: "MISSING_PHOTOS",
      severity: "warn",
      message_de:
        "System hat gefunden: Der Fall ist eingereicht, es sind aber keine Fotos hinterlegt.",
    })
  }

  const looksLikeMelde =
    snapshot.isTenantSubmitted ||
    snapshot.reporter_id !== null ||
    hasMelderTag(snapshot.description) ||
    hasEinheitTag(snapshot.description)

  if (looksLikeMelde && (!hasMelderTag(snapshot.description) || !hasEinheitTag(snapshot.description))) {
    findings.push({
      code: "MISSING_MELDER_TAGS",
      severity: "info",
      message_de:
        "System hat gefunden: Bei diesem Melde-Schaden fehlen Melder- oder Einheit-Angaben in der Beschreibung.",
    })
  }

  return findings
}

export async function assessClaimHealth(
  supabase: Client,
  claimId: string
): Promise<ClaimHealthReport> {
  const assessed_at = new Date().toISOString()

  const { data: claim, error: claimError } = await supabase
    .from("damage_reports")
    .select("id, status, claim_tier, estimated_amount, description, reporter_id")
    .eq("id", claimId)
    .maybeSingle()

  if (claimError || !claim) {
    return {
      claimId,
      assessed_at,
      findings: [
        {
          code: "CLAIM_NOT_FOUND",
          severity: "error",
          message_de: "System hat gefunden: Die Schadensakte konnte nicht geladen werden.",
        },
      ],
    }
  }

  const { data: photos, error: photosError } = await supabase
    .from("damage_photos")
    .select("id, ai_analysis")
    .eq("report_id", claimId)

  if (photosError) {
    console.error("[assessClaimHealth] photos", photosError.code)
  }

  const photoRows = photos ?? []
  const analyses = photoRows.map((p) => p.ai_analysis).filter(isPhotoAnalysisResult)
  const aggregate = aggregatePhotoAnalyses(analyses)

  const { count: assignmentCount, error: assignmentError } = await supabase
    .from("assignments")
    .select("id", { count: "exact", head: true })
    .eq("report_id", claimId)

  if (assignmentError) {
    console.error("[assessClaimHealth] assignments", assignmentError.code)
  }

  const { count: tenantCreatedCount, error: tenantError } = await supabase
    .from("activity_feed")
    .select("id", { count: "exact", head: true })
    .eq("report_id", claimId)
    .eq("event_type", "claim_created")
    .eq("actor_role", "tenant")

  if (tenantError) {
    console.error("[assessClaimHealth] activity", tenantError.code)
  }

  const findings = evaluateClaimHealth({
    id: claim.id,
    status: claim.status,
    claim_tier: claim.claim_tier,
    estimated_amount: Number(claim.estimated_amount ?? 0),
    description: claim.description,
    reporter_id: claim.reporter_id,
    photoCount: photoRows.length,
    photoSuggestedAmount: aggregate?.suggested_amount_eur ?? null,
    assignmentCount: assignmentCount ?? 0,
    isTenantSubmitted: (tenantCreatedCount ?? 0) > 0,
  })

  return { claimId: claim.id, assessed_at, findings }
}
