export type ClaimHealthSeverity = "info" | "warn" | "error"

export type ClaimHealthFixAction = "apply_photo_estimate" | "align_claim_tier"

export type ClaimHealthSuggestedFix = {
  action: ClaimHealthFixAction
  payload: {
    suggested_amount_eur?: number
    claim_tier?: "auto_track" | "out_of_scope"
  }
}

export type ClaimHealthFinding = {
  code: string
  severity: ClaimHealthSeverity
  message_de: string
  suggestedFix?: ClaimHealthSuggestedFix
}

export type ClaimHealthReport = {
  claimId: string
  assessed_at: string
  findings: ClaimHealthFinding[]
}
