// GDPR: Aggregates photo analysis into claim estimate. No raw images logged.

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Json } from "@/types/database.types"
import {
  analyzeDamagePhoto,
  type AnalyzePhotoInput,
} from "@/lib/ai/analyze-damage-photo"
import {
  isPhotoAnalysisResult,
  type ClaimPhotoEstimate,
  type PhotoAnalysisResult,
  type PhotoAnalysisSeverity,
} from "@/lib/ai/photo-analysis-types"
import { resolveClaimTier } from "@/lib/claims/tier"

type Client = SupabaseClient<Database>

function severityRank(s: PhotoAnalysisSeverity): number {
  return { low: 1, medium: 2, high: 3, critical: 4 }[s]
}

export function aggregatePhotoAnalyses(
  analyses: PhotoAnalysisResult[]
): ClaimPhotoEstimate | null {
  if (!analyses.length) return null

  const amounts = analyses.map((a) => a.suggested_amount_eur).sort((a, b) => a - b)
  const max = amounts[amounts.length - 1]
  const median = amounts[Math.floor(amounts.length / 2)]
  // Extent factor: more photos → broader damage assumption
  const extent = 1 + Math.min(0.45, (analyses.length - 1) * 0.12)
  const suggested = Math.round(((median * 0.55 + max * 0.45) * extent) / 50) * 50

  const confidence =
    analyses.reduce((s, a) => s + a.confidence, 0) / analyses.length

  let severity: PhotoAnalysisSeverity = "low"
  for (const a of analyses) {
    if (severityRank(a.severity) > severityRank(severity)) severity = a.severity
  }

  const sources = [...new Set(analyses.map((a) => a.source))]
  const top = analyses.slice().sort((a, b) => b.suggested_amount_eur - a.suggested_amount_eur)[0]

  return {
    suggested_amount_eur: Math.max(500, Math.min(125_000, suggested)),
    confidence: Math.round(confidence * 100) / 100,
    severity,
    photo_count: analyses.length,
    analyzed_count: analyses.length,
    summary_de:
      `Foto-Analyse (${analyses.length} Foto${analyses.length === 1 ? "" : "s"}): ` +
      `Systemvorschlag ${suggested.toLocaleString("de-DE")} €` +
      (top?.damage_type ? ` — Schwerpunkt ${top.damage_type}` : "") +
      ".",
    sources,
  }
}

export async function persistPhotoAnalysis(
  supabase: Client,
  photoId: string,
  analysis: PhotoAnalysisResult
): Promise<void> {
  const { error } = await supabase
    .from("damage_photos")
    .update({ ai_analysis: analysis as unknown as Json })
    .eq("id", photoId)

  if (error) {
    console.error("[persistPhotoAnalysis]", error.code)
  }
}

export async function analyzeAndPersistPhoto(
  supabase: Client,
  photoId: string,
  input: AnalyzePhotoInput
): Promise<PhotoAnalysisResult> {
  const analysis = await analyzeDamagePhoto(input)
  await persistPhotoAnalysis(supabase, photoId, analysis)
  return analysis
}

/**
 * Recompute claim estimate from all photo analyses.
 * - If force or current amount is 0: write estimated_amount (+ tier via trigger/app)
 * - Always returns aggregate for UI
 */
export async function syncClaimEstimateFromPhotos(
  supabase: Client,
  claimId: string,
  options?: { force?: boolean }
): Promise<ClaimPhotoEstimate | null> {
  const { data: photos, error } = await supabase
    .from("damage_photos")
    .select("ai_analysis")
    .eq("report_id", claimId)

  if (error) {
    console.error("[syncClaimEstimateFromPhotos] select", error.code)
    return null
  }

  const analyses = (photos ?? [])
    .map((p) => p.ai_analysis)
    .filter(isPhotoAnalysisResult)

  const aggregate = aggregatePhotoAnalyses(analyses)
  if (!aggregate) return null

  const { data: claim } = await supabase
    .from("damage_reports")
    .select("estimated_amount")
    .eq("id", claimId)
    .maybeSingle()

  const current = Number(claim?.estimated_amount ?? 0)
  const shouldWrite = options?.force || current <= 0

  if (shouldWrite) {
    const amount = aggregate.suggested_amount_eur
    const { error: updErr } = await supabase
      .from("damage_reports")
      .update({
        estimated_amount: amount,
        claim_tier: resolveClaimTier(amount),
      })
      .eq("id", claimId)

    if (updErr) {
      console.error("[syncClaimEstimateFromPhotos] update", updErr.code)
    }
  }

  return aggregate
}

export function parseAnalysesFromRows(
  rows: Array<{ ai_analysis: Json | null }>
): PhotoAnalysisResult[] {
  return rows.map((r) => r.ai_analysis).filter(isPhotoAnalysisResult)
}