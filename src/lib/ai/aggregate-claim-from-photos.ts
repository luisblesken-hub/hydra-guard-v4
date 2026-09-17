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
import {
  DEFAULT_LOCAL_WEIGHTS,
  type FindingCorrection,
} from "@/lib/ai/finding-correction-types"
import {
  aggregateWithCorrections,
  applyLocalWeightsToAnalysis,
  computeLocalWeights,
} from "@/lib/ai/local-weights"
import { resolveClaimTier } from "@/lib/claims/tier"

type Client = SupabaseClient<Database>

function severityRank(s: PhotoAnalysisSeverity): number {
  return { low: 1, medium: 2, high: 3, critical: 4 }[s]
}

/** Legacy aggregate without corrections (kept for simple call sites). */
export function aggregatePhotoAnalyses(
  analyses: PhotoAnalysisResult[]
): ClaimPhotoEstimate | null {
  if (!analyses.length) return null

  const amounts = analyses.map((a) => a.suggested_amount_eur).sort((a, b) => a - b)
  const max = amounts[amounts.length - 1]
  const median = amounts[Math.floor(amounts.length / 2)]
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
  let analysis = await analyzeDamagePhoto(input)
  try {
    const weights = await loadLocalWeights(supabase)
    analysis = applyLocalWeightsToAnalysis(analysis, weights)
  } catch {
    // non-blocking
  }
  await persistPhotoAnalysis(supabase, photoId, analysis)
  return analysis
}

type CorrectionRow = {
  id: string
  report_id: string
  photo_id: string | null
  original_damage_type: string | null
  original_amount_eur: number | null
  corrected_damage_type: string | null
  corrected_amount_eur: number | null
  corrected_severity: string | null
  note: string | null
  corrected_by: string
  created_at: string
  updated_at: string
}

function mapCorrection(row: CorrectionRow): FindingCorrection {
  return {
    id: row.id,
    report_id: row.report_id,
    photo_id: row.photo_id,
    original_damage_type: row.original_damage_type,
    original_amount_eur:
      row.original_amount_eur != null ? Number(row.original_amount_eur) : null,
    corrected_damage_type: row.corrected_damage_type,
    corrected_amount_eur:
      row.corrected_amount_eur != null ? Number(row.corrected_amount_eur) : null,
    corrected_severity: (row.corrected_severity as PhotoAnalysisSeverity | null) ?? null,
    note: row.note,
    corrected_by: row.corrected_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function loadFindingCorrections(
  supabase: Client,
  claimId: string
): Promise<FindingCorrection[]> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("ai_finding_corrections")
    .select(
      "id, report_id, photo_id, original_damage_type, original_amount_eur, corrected_damage_type, corrected_amount_eur, corrected_severity, note, corrected_by, created_at, updated_at"
    )
    .eq("report_id", claimId)

  if (error) {
    console.error("[loadFindingCorrections]", error.code)
    return []
  }

  return ((data ?? []) as CorrectionRow[]).map(mapCorrection)
}

/** Correction history → local amount multipliers (no external training). */
export async function loadLocalWeights(supabase: Client) {
  const { data, error } = await (supabase as SupabaseClient)
    .from("ai_finding_corrections")
    .select("original_damage_type, original_amount_eur, corrected_amount_eur")
    .not("corrected_amount_eur", "is", null)
    .limit(500)

  if (error || !data?.length) {
    if (error) console.error("[loadLocalWeights]", error.code)
    return DEFAULT_LOCAL_WEIGHTS
  }

  return computeLocalWeights(
    (
      data as Array<{
        original_damage_type: string | null
        original_amount_eur: number | null
        corrected_amount_eur: number | null
      }>
    ).map((r) => ({
      original_damage_type: r.original_damage_type,
      original_amount_eur: r.original_amount_eur != null ? Number(r.original_amount_eur) : null,
      corrected_amount_eur:
        r.corrected_amount_eur != null ? Number(r.corrected_amount_eur) : null,
    }))
  )
}

/**
 * Recompute claim estimate from photo analyses + owner corrections + local weights.
 */
export async function syncClaimEstimateFromPhotos(
  supabase: Client,
  claimId: string,
  options?: { force?: boolean }
): Promise<ClaimPhotoEstimate | null> {
  const { data: photos, error } = await supabase
    .from("damage_photos")
    .select("id, ai_analysis")
    .eq("report_id", claimId)

  if (error) {
    console.error("[syncClaimEstimateFromPhotos] select", error.code)
    return null
  }

  const rows = (photos ?? [])
    .map((p) => ({
      photoId: p.id as string,
      analysis: p.ai_analysis,
    }))
    .filter((r): r is { photoId: string; analysis: PhotoAnalysisResult } =>
      isPhotoAnalysisResult(r.analysis)
    )

  if (!rows.length) return null

  const [corrections, weights] = await Promise.all([
    loadFindingCorrections(supabase, claimId),
    loadLocalWeights(supabase),
  ])

  const aggregate = aggregateWithCorrections(rows, corrections, weights)
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
