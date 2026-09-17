// GDPR: Owner corrections for AI findings. No image bytes stored.
// Legal basis: Art. 6(1)(b) DSGVO — contract performance.

import type { PhotoAnalysisSeverity, PhotoAnalysisSource } from "@/lib/ai/photo-analysis-types"

export type FindingCorrectionScope = "photo" | "claim"

export type FindingCorrection = {
  id?: string
  report_id: string
  photo_id: string | null
  original_damage_type: string | null
  original_amount_eur: number | null
  corrected_damage_type: string | null
  corrected_amount_eur: number | null
  corrected_severity: PhotoAnalysisSeverity | null
  note: string | null
  corrected_by?: string
  created_at?: string
  updated_at?: string
}

/** Structured payload stored in activity_feed.new_value */
export type FindingCorrectionActivityPayload = {
  kind: "ai_finding_correction"
  version: 1
  scope: FindingCorrectionScope
  photo_id: string | null
  original: {
    damage_type: string | null
    amount_eur: number | null
  }
  corrected: {
    damage_type: string | null
    amount_eur: number | null
    severity: PhotoAnalysisSeverity | null
  }
}

export type LocalAiWeights = {
  version: 1
  /** Multiplier per damage_type from historical corrections (clamped). */
  amount_mult_by_type: Record<string, number>
  sample_count_by_type: Record<string, number>
}

export const DEFAULT_LOCAL_WEIGHTS: LocalAiWeights = {
  version: 1,
  amount_mult_by_type: {},
  sample_count_by_type: {},
}

/** Relative weight of a human-corrected photo amount vs raw AI amount. */
export const CORRECTION_AMOUNT_WEIGHT = 2.5

export const DAMAGE_TYPE_OPTIONS = [
  "Rohrbruch",
  "Geräte-Leckage",
  "Wasserschaden",
  "Dachleck",
  "Schimmel / Folgeschaden",
  "Feuchtigkeitsfleck",
  "Bedienungsfehler / Überlauf",
  "Unklarer Wasserschaden",
] as const

export function isFindingCorrection(value: unknown): value is FindingCorrection {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return typeof v.report_id === "string"
}

export type EffectivePhotoFinding = {
  photoId: string
  damage_type: string
  suggested_amount_eur: number
  severity: PhotoAnalysisSeverity
  confidence: number
  source: PhotoAnalysisSource
  corrected: boolean
}
