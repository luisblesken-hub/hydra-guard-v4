"use client"

import { useState, useTransition } from "react"
import { saveFindingCorrectionAction } from "@/app/claims/[id]/photos/save-finding-correction-action"
import {
  DAMAGE_TYPE_OPTIONS,
  type FindingCorrection,
} from "@/lib/ai/finding-correction-types"
import type { ClaimPhotoEstimate } from "@/lib/ai/photo-analysis-types"

type Props = {
  claimId: string
  estimate: ClaimPhotoEstimate
  claimCorrection: FindingCorrection | null
  canEdit: boolean
}

export function ClaimFindingCorrectionForm({
  claimId,
  estimate,
  claimCorrection,
  canEdit,
}: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [applyAmount, setApplyAmount] = useState(true)
  const [damageType, setDamageType] = useState(
    claimCorrection?.corrected_damage_type ?? DAMAGE_TYPE_OPTIONS[2]
  )
  const [amount, setAmount] = useState(
    String(
      claimCorrection?.corrected_amount_eur ?? estimate.suggested_amount_eur
    )
  )

  if (!canEdit) return null

  return (
    <div className="mt-2">
      {claimCorrection && (
        <p className="mb-1 text-[11px] text-hg-steel">
          Claim-Korrektur aktiv
          {claimCorrection.corrected_damage_type
            ? ` · ${claimCorrection.corrected_damage_type}`
            : ""}
          {claimCorrection.corrected_amount_eur != null
            ? ` · ${claimCorrection.corrected_amount_eur.toLocaleString("de-DE")} €`
            : ""}
        </p>
      )}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-slate-700 underline-offset-2 hover:underline"
        >
          System-Vorschlag korrigieren
        </button>
      ) : (
        <form
          className="mt-1 space-y-2 rounded-md border border-hg-line bg-white p-3"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            const parsedAmount = Number(String(amount).replace(",", "."))
            startTransition(async () => {
              const result = await saveFindingCorrectionAction({
                claimId,
                photoId: null,
                correctedDamageType: damageType,
                correctedAmountEur: Number.isFinite(parsedAmount)
                  ? parsedAmount
                  : null,
                applyToClaimAmount: applyAmount,
              })
              if (!result.success) {
                setError(result.error)
                return
              }
              setOpen(false)
            })
          }}
        >
          <p className="text-xs text-slate-600">
            Korrigieren Sie Typ oder Betrag. Die Aggregate-Schätzung nutzt Ihre
            Korrektur mit höherem Gewicht (lokal, ohne externes Training).
          </p>
          <label className="block text-xs text-slate-500">
            Schadenstyp
            <select
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              {DAMAGE_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-slate-500">
            Betrag (€)
            <input
              type="number"
              min={500}
              max={125000}
              step={50}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={applyAmount}
              onChange={(e) => setApplyAmount(e.target.checked)}
            />
            Auch als Claim-Schätzung übernehmen
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-hg-steel px-3 py-1.5 text-xs font-medium text-white hover:bg-hg-ink disabled:opacity-50"
            >
              {pending ? "Speichere…" : "Korrektur speichern"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setOpen(false)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
