// GDPR: Photo analysis may describe interiors. Never log image bytes or signed URLs.
// Legal basis: Art. 6(1)(b) DSGVO — contract performance.

export type PhotoAnalysisSeverity = "low" | "medium" | "high" | "critical"

export type PhotoAnalysisSource = "heuristic" | "vision"

export type PhotoAnalysisResult = {
  version: 1
  source: PhotoAnalysisSource
  model: string
  analyzed_at: string
  damage_type: string
  severity: PhotoAnalysisSeverity
  suggested_amount_eur: number
  confidence: number
  room_hint: string | null
  summary_de: string
  signals: string[]
}

export type ClaimPhotoEstimate = {
  suggested_amount_eur: number
  confidence: number
  severity: PhotoAnalysisSeverity
  photo_count: number
  analyzed_count: number
  summary_de: string
  sources: PhotoAnalysisSource[]
}

export function isPhotoAnalysisResult(value: unknown): value is PhotoAnalysisResult {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    v.version === 1 &&
    typeof v.suggested_amount_eur === "number" &&
    typeof v.summary_de === "string" &&
    typeof v.severity === "string"
  )
}
