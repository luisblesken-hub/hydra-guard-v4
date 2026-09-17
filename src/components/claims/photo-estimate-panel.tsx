"use client";

import { useState, useTransition } from "react";
import { applyPhotoEstimateAction } from "@/app/claims/[id]/photos/apply-estimate-action";
import { reanalyzeClaimPhotosAction } from "@/app/claims/[id]/photos/reanalyze-action";
import type { ClaimPhotoEstimate } from "@/lib/ai/photo-analysis-types";

type Props = {
  claimId: string;
  estimate: ClaimPhotoEstimate | null;
  currentAmount: number;
  canApply: boolean;
};

export function PhotoEstimatePanel({ claimId, estimate, currentAmount, canApply }: Props) {
  const [pending, startTransition] = useTransition();
  const [reanalyzePending, startReanalyze] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!estimate) return null;

  const suggested = estimate.suggested_amount_eur;
  const fmt = (n: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  const differs = Math.abs(suggested - currentAmount) >= 100;
  const hasVision = estimate.sources.includes("vision");
  const hasHeuristic = estimate.sources.includes("heuristic");
  const sourceLabel =
    hasVision && !hasHeuristic
      ? "KI (Vision)"
      : hasVision && hasHeuristic
        ? "KI + System"
        : "System (Heuristik)";
  const sourceHint =
    hasVision && !hasHeuristic
      ? "Bildanalyse über OpenAI Vision"
      : hasVision && hasHeuristic
        ? "Gemischt: einzelne Fotos KI, andere System"
        : "Regelbasierte Einschätzung ohne externe KI";

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
          <dd className="font-semibold text-hg-ink">{sourceLabel}</dd>
          <dd className="mt-0.5 text-[10px] text-slate-500">{sourceHint}</dd>
        </div>
      </dl>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {info && <p className="mt-2 text-xs text-hg-steel">{info}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {canApply && differs && (
          <button
            type="button"
            disabled={pending || reanalyzePending}
            onClick={() => {
              setError(null);
              setInfo(null);
              startTransition(async () => {
                const result = await applyPhotoEstimateAction(claimId);
                if (!result.success) {
                  setError(result.error ?? "Übernahme fehlgeschlagen.");
                }
              });
            }}
            className="inline-flex rounded-md bg-hg-steel px-3 py-1.5 text-xs font-medium text-white hover:bg-hg-ink disabled:opacity-50"
          >
            {pending ? "Übernehme…" : `Vorschlag ${fmt(suggested)} als Schätzung übernehmen`}
          </button>
        )}
        {canApply && (
          <button
            type="button"
            disabled={pending || reanalyzePending}
            onClick={() => {
              setError(null);
              setInfo(null);
              startReanalyze(async () => {
                const result = await reanalyzeClaimPhotosAction(claimId);
                if (!result.success) {
                  setError(result.error);
                  return;
                }
                setInfo(
                  result.visionConfigured
                    ? `Neu analysiert: ${result.visionCount}× KI, ${result.heuristicCount}× System`
                    : `Neu analysiert mit System-Heuristik (${result.heuristicCount} Fotos). Für KI: OPENAI_API_KEY setzen.`
                );
              });
            }}
            className="inline-flex rounded-md border border-hg-line bg-white px-3 py-1.5 text-xs font-medium text-hg-ink hover:bg-slate-100 disabled:opacity-50"
          >
            {reanalyzePending ? "Analysiere…" : "Fotos erneut analysieren"}
          </button>
        )}
      </div>
    </div>
  );
}
