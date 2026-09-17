"use client";

import { useState, useTransition } from "react";
import { applyPhotoEstimateAction } from "@/app/claims/[id]/photos/apply-estimate-action";
import type { ClaimPhotoEstimate } from "@/lib/ai/photo-analysis-types";

type Props = {
  claimId: string;
  estimate: ClaimPhotoEstimate | null;
  currentAmount: number;
  canApply: boolean;
};

export function PhotoEstimatePanel({ claimId, estimate, currentAmount, canApply }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!estimate) return null;

  const suggested = estimate.suggested_amount_eur;
  const fmt = (n: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  const differs = Math.abs(suggested - currentAmount) >= 100;
  const source =
    estimate.sources.includes("vision") && estimate.sources.length === 1
      ? "KI"
      : estimate.sources.includes("vision")
        ? "KI + System"
        : "System";

  return (
    <div className="rounded-lg border border-hg-line bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-hg-ink">Foto-basierte Schätzung</h3>
      <p className="mt-1 text-xs text-slate-600">{estimate.summary_de}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-slate-500">Vorschlag</dt>
          <dd className="font-semibold text-hg-ink">{fmt(suggested)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Aktuell</dt>
          <dd className="font-semibold text-hg-ink">{fmt(currentAmount)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Fotos</dt>
          <dd className="font-semibold text-hg-ink">{estimate.analyzed_count}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Quelle</dt>
          <dd className="font-semibold text-hg-ink">{source}</dd>
        </div>
      </dl>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {canApply && differs && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await applyPhotoEstimateAction(claimId);
              if (!result.success) {
                setError(result.error ?? "Übernahme fehlgeschlagen.");
              }
            });
          }}
          className="mt-3 inline-flex rounded-md bg-hg-steel px-3 py-1.5 text-xs font-medium text-white hover:bg-hg-ink disabled:opacity-50"
        >
          {pending ? "Übernehme…" : `Vorschlag ${fmt(suggested)} als Schätzung übernehmen`}
        </button>
      )}
    </div>
  );
}
