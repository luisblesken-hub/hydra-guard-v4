'use client';

import Link from "next/link";
import type { ClaimWithProperty } from "@/lib/db/damage-reports";
import { splitLabel, statusColor, statusLabel } from "@/lib/utils/claim-status";

type Props = {
  claims: ClaimWithProperty[];
};

export function ClaimsList({ claims }: Props) {
  if (!claims.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <p className="text-sm font-medium text-slate-700">
          Noch keine Schadensfälle vorhanden.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Lege deinen ersten Fall an, um den Hydra-Guard-Flow zu testen.
        </p>
        <Link
          href="/claims/new"
          className="mt-4 inline-flex rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-400"
        >
          Ersten Schaden melden
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {claims.map((claim) => (
        <article
          key={claim.id}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">
              {claim.property_address}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${statusColor(
                  claim.status
                )}`}
              >
                {statusLabel(claim.status)}
              </span>
              {claim.insurance_split && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                  {splitLabel(claim.insurance_split)}
                </span>
              )}
              <span className="text-slate-400 text-[11px]">
                ID: {claim.id.slice(0, 8)}…
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Angelegt am{" "}
              {new Intl.DateTimeFormat("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).format(new Date(claim.created_at))}
            </p>
          </div>

          <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-end">
            <p className="text-sm font-semibold text-slate-900">
              {new Intl.NumberFormat("de-DE", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              }).format(claim.damage_amount_estimate)}
            </p>
            <Link
              href={`/claims/${claim.id}`}
              className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Details
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

