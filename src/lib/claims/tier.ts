/**
 * Claim routing by estimated damage amount.
 * Two tracks only: in-scope (auto) vs outsourced (Gutachter).
 * expert_track remains in the DB enum for legacy rows only.
 */
export const OUT_OF_SCOPE_THRESHOLD = 12_500

export type ClaimTier = "auto_track" | "out_of_scope"

export function resolveClaimTier(estimatedAmount: number): ClaimTier {
  return estimatedAmount > OUT_OF_SCOPE_THRESHOLD ? "out_of_scope" : "auto_track"
}

export function getClaimTierPreview(amount: number): {
  label: string
  color: string
  desc: string
} | null {
  if (!amount || amount <= 0) return null
  if (amount > OUT_OF_SCOPE_THRESHOLD) {
    return {
      label: "Gutachter-Track",
      color: "bg-red-50 border-red-200 text-red-700",
      desc: `Ab ${OUT_OF_SCOPE_THRESHOLD.toLocaleString("de-DE")} € wird der Fall extern an einen Gutachter übergeben.`,
    }
  }
  return {
    label: "Standard-Track",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    desc: "Bearbeitung über den HydraGuard-Workflow (Sanierer, Status, Rechnungen).",
  }
}
