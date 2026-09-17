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

  const sourceLabel = analysis.source === "vision" ? "KI" : "System";
  const amount = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(analysis.suggested_amount_eur);

  return (
    <div className="mt-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5 text-[11px] text-sky-900">
      <p className="font-semibold">
        {sourceLabel}-Analyse · {amount}
      </p>
      <p className="mt-0.5 leading-snug text-sky-800/90">
        {analysis.damage_type}
        {analysis.room_hint ? ` · ${analysis.room_hint}` : ""} ·{" "}
        {SEVERITY_DE[analysis.severity] ?? analysis.severity}
      </p>
    </div>
  );
}
