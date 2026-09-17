"use client"

import { useState, useTransition } from "react"
import { applyClaimHealthFixAction } from "@/app/claims/[id]/health/apply-health-fix-action"
import type {
  ClaimHealthFinding,
  ClaimHealthReport,
} from "@/lib/ai/claim-health-types"

type Props = {
  report: ClaimHealthReport
  canApply: boolean
}

const SEVERITY_DE: Record<ClaimHealthFinding["severity"], string> = {
  info: "Hinweis",
  warn: "Warnung",
  error: "Fehler",
}

const SEVERITY_STYLE: Record<ClaimHealthFinding["severity"], string> = {
  info: "border-hg-line bg-slate-50 text-slate-700",
  warn: "border-amber-300/80 bg-amber-50 text-amber-900",
  error: "border-red-300/70 bg-red-50 text-red-800",
}

function fixHint(finding: ClaimHealthFinding): string | null {
  const fix = finding.suggestedFix
  if (!fix) return null
  if (fix.action === "apply_photo_estimate" && fix.payload.suggested_amount_eur != null) {
    const amount = new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(fix.payload.suggested_amount_eur)
    return `Schätzung auf ${amount} setzen`
  }
  if (fix.action === "align_claim_tier" && fix.payload.claim_tier) {
    const label =
      fix.payload.claim_tier === "out_of_scope" ? "Gutachter-Track" : "Standard-Track"
    return `Track auf ${label} setzen`
  }
  return null
}

function HealthFindingRow({
  claimId,
  finding,
  canApply,
}: {
  claimId: string
  finding: ClaimHealthFinding
  canApply: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const hint = fixHint(finding)
  const action = finding.suggestedFix?.action

  return (
    <li className={`rounded-md border px-3 py-2.5 ${SEVERITY_STYLE[finding.severity]}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide">
            {SEVERITY_DE[finding.severity]}
          </p>
          <p className="text-sm">{finding.message_de}</p>
          {hint && <p className="text-xs opacity-80">{hint}</p>}
          {error && <p className="text-xs text-red-700">{error}</p>}
        </div>
        {canApply && action && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null)
              startTransition(async () => {
                const result = await applyClaimHealthFixAction(claimId, action)
                if (!result.success) {
                  setError(result.error)
                }
              })
            }}
            className="shrink-0 rounded-md bg-hg-steel px-3 py-1.5 text-xs font-medium text-white hover:bg-hg-ink disabled:opacity-50"
          >
            {pending ? "Übernehme…" : "Vorschlag übernehmen"}
          </button>
        )}
      </div>
    </li>
  )
}

export function ClaimHealthPanel({ report, canApply }: Props) {
  const findings = report.findings
  const warnCount = findings.filter((f) => f.severity === "warn" || f.severity === "error").length

  return (
    <section className="space-y-3 rounded-xl border border-hg-line bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-hg-ink">Systemprüfung</h2>
        <p className="text-xs text-slate-500">
          {findings.length === 0
            ? "Keine Auffälligkeiten"
            : warnCount > 0
              ? `${warnCount} Warnung${warnCount === 1 ? "" : "en"}`
              : `${findings.length} Hinweis${findings.length === 1 ? "" : "e"}`}
        </p>
      </div>
      {findings.length === 0 ? (
        <p className="text-sm text-slate-600">
          Keine Auffälligkeiten. Die Akte ist intern konsistent.
        </p>
      ) : (
        <ul className="space-y-2">
          {findings.map((finding) => (
            <HealthFindingRow
              key={finding.code}
              claimId={report.claimId}
              finding={finding}
              canApply={canApply}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
