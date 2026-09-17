"use client";

import type { PhotoAnalysisResult } from "@/lib/ai/photo-analysis-types";

const SEVERITY_DE: Record<string, string> = {
  low: "gering",
  medium: "mittel",
  high: "hoch",
  critical: "kritisch",
};

export function PhotoAnalysisBadge({ analysis }: { analysis: PhotoAnalysisResult | null }) {
  if (!analysis) return null;

  const isVision = analysis.source === "vision";
  const amount = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(analysis.suggested_amount_eur);

  return (
    <div
      className={`mt-1 rounded-md border px-2 py-1.5 text-[11px] ${
        isVision
          ? "border-hg-steel/40 bg-hg-steel/5 text-hg-ink"
          : "border-hg-line bg-slate-50 text-slate-800"
      }`}
    >
      <p className="font-semibold">
        {isVision ? "Quelle: KI" : "Quelle: System"}
        <span className="font-normal text-slate-500">
          {" "}
          · {isVision ? "Vision" : "Heuristik"} · {amount}
        </span>
      </p>
      <p className="mt-0.5 leading-snug opacity-90">
        {analysis.damage_type}
        {analysis.room_hint ? ` · ${analysis.room_hint}` : ""} ·{" "}
        {SEVERITY_DE[analysis.severity] ?? analysis.severity}
      </p>
    </div>
  );
}
