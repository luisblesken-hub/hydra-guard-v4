"use client"

import { useState, useTransition } from "react"
import { saveFindingCorrectionAction } from "@/app/claims/[id]/photos/save-finding-correction-action"
import {
  DAMAGE_TYPE_OPTIONS,
  type FindingCorrection,
} from "@/lib/ai/finding-correction-types"
import type { PhotoAnalysisResult } from "@/lib/ai/photo-analysis-types"

type Props = {
  claimId: string
  photoId: string
  analysis: PhotoAnalysisResult | null
  existing: FindingCorrection | null
  canEdit: boolean
}

export function PhotoFindingCorrectionForm({
  claimId,
  photoId,
  analysis,
  existing,
  canEdit,
}: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [damageType, setDamageType] = useState(
    existing?.corrected_damage_type ?? analysis?.damage_type ?? DAMAGE_TYPE_OPTIONS[2]
  )
  const [amount, setAmount] = useState(
    String(
      existing?.corrected_amount_eur ?? analysis?.suggested_amount_eur ?? ""
    )
  )

  if (!canEdit || !analysis) return null

  const corrected = Boolean(existing)

  return (
    <div className="mt-1">
      {corrected && (
        <p className="text-[10px] font-medium text-hg-steel">
          Korrigiert
          {existing?.corrected_damage_type
            ? `: ${existing.corrected_damage_type}`
            : ""}
          {existing?.corrected_amount_eur != null
            ? ` · ${existing.corrected_amount_eur.toLocaleString("de-DE")} €`
            : ""}
        </p>
      )}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[11px] font-medium text-slate-600 underline-offset-2 hover:underline"
        >
          {corrected ? "Korrektur ändern" : "Finding korrigieren"}
        </button>
      ) : (
        <form
          className="mt-1 space-y-1.5 rounded-md border border-hg-line bg-white p-2"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            const parsedAmount = Number(String(amount).replace(",", "."))
            startTransition(async () => {
              const result = await saveFindingCorrectionAction({
                claimId,
                photoId,
                correctedDamageType: damageType,
                correctedAmountEur: Number.isFinite(parsedAmount)
                  ? parsedAmount
                  : null,
                applyToClaimAmount: false,
              })
              if (!result.success) {
                setError(result.error)
                return
              }
              setOpen(false)
            })
          }}
        >
          <label className="block text-[10px] text-slate-500">
            Schadenstyp
            <select
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              className="mt-0.5 w-full rounded border border-slate-300 px-1.5 py-1 text-xs"
            >
              {DAMAGE_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[10px] text-slate-500">
            Betrag (€)
            <input
              type="number"
              min={500}
              max={125000}
              step={50}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-0.5 w-full rounded border border-slate-300 px-1.5 py-1 text-xs"
            />
          </label>
          {error && <p className="text-[10px] text-red-600">{error}</p>}
          <div className="flex gap-1">
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-hg-steel px-2 py-1 text-[11px] font-medium text-white hover:bg-hg-ink disabled:opacity-50"
            >
              {pending ? "Speichere…" : "Speichern"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setOpen(false)}
              className="rounded border border-slate-300 px-2 py-1 text-[11px] text-slate-600"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
