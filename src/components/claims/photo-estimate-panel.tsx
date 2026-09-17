"use client";

import { useTransition } from "react";
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
    <div className="rounded-lg border border-sky-200 bg-sky-50/80 p-4">
      <h3 className="text-sm font-semibold text-sky-950">Foto-basierte Schätzung</h3>
      <p className="mt-1 text-xs text-sky-900/80">{estimate.summary_de}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-sky-800/70">Vorschlag</dt>
          <dd className="font-semibold text-sky-950">{fmt(suggested)}</dd>
        </div>
        <div>
          <dt className="text-sky-800/70">Aktuell</dt>
          <dd className="font-semibold text-sky-950">{fmt(currentAmount)}</dd>
        </div>
        <div>
          <dt className="text-sky-800/70">Fotos</dt>
          <dd className="font-semibold text-sky-950">{estimate.analyzed_count}</dd>
        </div>
        <div>
          <dt className="text-sky-800/70">Quelle</dt>
          <dd className="font-semibold text-sky-950">{source}</dd>
        </div>
      </dl>
      {canApply && differs && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await applyPhotoEstimateAction(claimId);
            });
          }}
          className="mt-3 inline-flex rounded-md bg-sky-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-800 disabled:opacity-50"
        >
          {pending ? "Übernehme…" : `Vorschlag ${fmt(suggested)} als Schätzung übernehmen`}
        </button>
      )}
    </div>
  );
}
