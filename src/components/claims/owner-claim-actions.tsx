"use client";

import { useTransition, useState } from "react";
import { ownerUpdateClaimStatusAction } from "./owner-status-actions";

const TRANSITIONS: Record<
  string,
  { label: string; next: "approved" | "rejected" | "dispatched" | "closed"; style: string }[]
> = {
  submitted: [
    { label: "Freigeben", next: "approved", style: "bg-hg-ink text-white hover:bg-hg-steel" },
    { label: "Ablehnen", next: "rejected", style: "border border-red-300 text-red-700 hover:bg-red-50" },
  ],
  validating: [
    { label: "Freigeben", next: "approved", style: "bg-hg-ink text-white hover:bg-hg-steel" },
    { label: "Ablehnen", next: "rejected", style: "border border-red-300 text-red-700 hover:bg-red-50" },
  ],
  approved: [
    {
      label: "Als beauftragt markieren",
      next: "dispatched",
      style: "bg-hg-steel text-white hover:bg-hg-ink",
    },
    {
      label: "Archivieren",
      next: "closed",
      style: "border border-slate-300 text-slate-700 hover:bg-slate-50",
    },
  ],
  invoice_approved: [
    {
      label: "Archivieren",
      next: "closed",
      style: "border border-slate-300 text-slate-700 hover:bg-slate-50",
    },
  ],
};

export function OwnerClaimActions({
  reportId,
  status,
}: {
  reportId: string;
  status: string;
}) {
  const transitions = TRANSITIONS[status];
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  if ((!transitions || transitions.length === 0) && status !== "approved" && status !== "dispatched") {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(transitions ?? []).map((t) => (
        <button
          key={t.next + t.label}
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const res = await ownerUpdateClaimStatusAction(reportId, t.next);
              setMsg(res.message ?? null);
            });
          }}
          className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${t.style}`}
        >
          {t.label}
        </button>
      ))}
      {(status === "approved" || status === "dispatched") && (
        <a
          href="#dispatcher"
          className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
        >
          Sanierer zuweisen ↓
        </a>
      )}
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
    </div>
  );
}
