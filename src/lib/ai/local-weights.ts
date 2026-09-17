// Local rule weights from owner corrections — no external training.

import {
  CORRECTION_AMOUNT_WEIGHT,
  DEFAULT_LOCAL_WEIGHTS,
  type FindingCorrection,
  type LocalAiWeights,
} from "@/lib/ai/finding-correction-types"
import type {
  ClaimPhotoEstimate,
  PhotoAnalysisResult,
  PhotoAnalysisSeverity,
} from "@/lib/ai/photo-analysis-types"

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function clampAmount(n: number): number {
  return Math.max(500, Math.min(125_000, Math.round(n / 50) * 50))
}

function severityRank(s: PhotoAnalysisSeverity): number {
  return { low: 1, medium: 2, high: 3, critical: 4 }[s]
}

/**
 * Derive local amount multipliers from correction history.
 * ratio = corrected / original per damage_type (geometric mean, clamped 0.55–1.45).
 */
export function computeLocalWeights(
  rows: Array<{
    original_damage_type: string | null
    original_amount_eur: number | null
    corrected_amount_eur: number | null
  }>
): LocalAiWeights {
  const buckets: Record<string, number[]> = {}

  for (const row of rows) {
    const type = row.original_damage_type?.trim()
    const orig = Number(row.original_amount_eur)
    const corr = Number(row.corrected_amount_eur)
    if (!type || !(orig > 0) || !(corr > 0)) continue
    const ratio = clamp(corr / orig, 0.4, 2.0)
    ;(buckets[type] ??= []).push(ratio)
  }

  const amount_mult_by_type: Record<string, number> = {}
  const sample_count_by_type: Record<string, number> = {}

  for (const [type, ratios] of Object.entries(buckets)) {
    if (ratios.length < 1) continue
    const logAvg =
      ratios.reduce((s, r) => s + Math.log(r), 0) / ratios.length
    const mult = clamp(Math.exp(logAvg), 0.55, 1.45)
    // Soften with prior 1.0 until we have enough samples
    const n = ratios.length
    const blended = (1.0 * 2 + mult * n) / (2 + n)
    amount_mult_by_type[type] = Math.round(blended * 1000) / 1000
    sample_count_by_type[type] = n
  }

  return { version: 1, amount_mult_by_type, sample_count_by_type }
}

/** Apply local type-based multiplier to a raw analysis (before photo correction overlay). */
export function applyLocalWeightsToAnalysis(
  analysis: PhotoAnalysisResult,
  weights: LocalAiWeights = DEFAULT_LOCAL_WEIGHTS
): PhotoAnalysisResult {
  const mult = weights.amount_mult_by_type[analysis.damage_type]
  if (!mult || Math.abs(mult - 1) < 0.02) return analysis
  const amount = clampAmount(analysis.suggested_amount_eur * mult)
  return {
    ...analysis,
    suggested_amount_eur: amount,
    signals: [
      ...analysis.signals,
      `Lokale Gewichtung ×${mult.toFixed(2)} (${analysis.damage_type})`,
    ].slice(0, 10),
    summary_de:
      analysis.summary_de.replace(
        /\d{1,3}(?:\.\d{3})*(?:,\d+)?\s*€/,
        `${amount.toLocaleString("de-DE")} €`
      ) || analysis.summary_de,
  }
}

export type PhotoAnalysisRow = {
  photoId: string
  analysis: PhotoAnalysisResult
}

/**
 * Overlay photo-level corrections and local weights onto analyses for aggregation.
 */
export function buildEffectiveAnalyses(
  rows: PhotoAnalysisRow[],
  corrections: FindingCorrection[],
  weights: LocalAiWeights = DEFAULT_LOCAL_WEIGHTS
): Array<PhotoAnalysisResult & { _photoId: string; _corrected: boolean; _weight: number }> {
  const byPhoto = new Map(
    corrections.filter((c) => c.photo_id).map((c) => [c.photo_id as string, c])
  )

  return rows.map(({ photoId, analysis }) => {
    const weighted = applyLocalWeightsToAnalysis(analysis, weights)
    const corr = byPhoto.get(photoId)
    if (!corr) {
      return {
        ...weighted,
        _photoId: photoId,
        _corrected: false,
        _weight: 1,
      }
    }

    const amount =
      corr.corrected_amount_eur != null && corr.corrected_amount_eur > 0
        ? clampAmount(Number(corr.corrected_amount_eur))
        : weighted.suggested_amount_eur
    const damage_type = corr.corrected_damage_type?.trim() || weighted.damage_type
    const severity =
      (corr.corrected_severity as PhotoAnalysisSeverity | null) ?? weighted.severity

    return {
      ...weighted,
      damage_type,
      suggested_amount_eur: amount,
      severity,
      confidence: Math.min(0.95, weighted.confidence + 0.15),
      summary_de: `Korrigiert: ${damage_type}, ca. ${amount.toLocaleString("de-DE")} €.`,
      signals: [...weighted.signals, "Owner-Korrektur"].slice(0, 10),
      _photoId: photoId,
      _corrected: true,
      _weight: CORRECTION_AMOUNT_WEIGHT,
    }
  })
}

/**
 * Weighted aggregate: corrected photos count more. Claim-level correction blends in.
 */
export function aggregateWithCorrections(
  rows: PhotoAnalysisRow[],
  corrections: FindingCorrection[],
  weights: LocalAiWeights = DEFAULT_LOCAL_WEIGHTS
): ClaimPhotoEstimate | null {
  const effective = buildEffectiveAnalyses(rows, corrections, weights)
  if (!effective.length) return null

  // Weighted average of amounts (not plain median) so corrections pull strongly
  let weightSum = 0
  let amountSum = 0
  let confidenceSum = 0
  let severity: PhotoAnalysisSeverity = "low"
  const sources = new Set(effective.map((a) => a.source))
  let correctedCount = 0

  for (const a of effective) {
    const w = a._weight
    weightSum += w
    amountSum += a.suggested_amount_eur * w
    confidenceSum += a.confidence * w
    if (severityRank(a.severity) > severityRank(severity)) severity = a.severity
    if (a._corrected) correctedCount += 1
  }

  let suggested = clampAmount(amountSum / weightSum)

  const claimCorr = corrections.find((c) => c.photo_id == null) ?? null
  if (claimCorr?.corrected_amount_eur != null && claimCorr.corrected_amount_eur > 0) {
    const claimAmount = clampAmount(Number(claimCorr.corrected_amount_eur))
    // 65% claim correction + 35% photo aggregate
    suggested = clampAmount(claimAmount * 0.65 + suggested * 0.35)
    correctedCount += 1
  }

  const top = effective.slice().sort((a, b) => b.suggested_amount_eur - a.suggested_amount_eur)[0]
  const claimType = claimCorr?.corrected_damage_type?.trim() || top?.damage_type
  const confidence = Math.round((confidenceSum / weightSum) * 100) / 100

  const corrNote =
    correctedCount > 0
      ? ` inkl. ${correctedCount} Korrektur${correctedCount === 1 ? "" : "en"}`
      : ""

  return {
    suggested_amount_eur: suggested,
    confidence,
    severity: claimCorr?.corrected_severity ?? severity,
    photo_count: effective.length,
    analyzed_count: effective.length,
    summary_de:
      `Foto-Analyse (${effective.length} Foto${effective.length === 1 ? "" : "s"}${corrNote}): ` +
      `Systemvorschlag ${suggested.toLocaleString("de-DE")} €` +
      (claimType ? ` — Schwerpunkt ${claimType}` : "") +
      ".",
    sources: [...sources],
  }
}
