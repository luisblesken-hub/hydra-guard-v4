"use client";

import { useActionState, useState } from "react";
import { submitInvoiceAction, type InvoiceActionState } from "@/components/invoices/invoice-actions";

const INITIAL: InvoiceActionState = {};

export function QuickInvoiceForm({
  reportId,
  hasInvoice,
}: {
  reportId: string;
  hasInvoice: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(submitInvoiceAction, INITIAL);

  if (hasInvoice) {
    return (
      <span className="text-xs text-slate-400">Rechnung bereits eingereicht</span>
    );
  }

  if (state.success) {
    return <span className="text-xs text-emerald-600">✓ Rechnung eingereicht</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-md border border-indigo-300 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
      >
        Rechnung einreichen
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap gap-2 items-end">
      <input type="hidden" name="reportId" value={reportId} />
      <label className="flex flex-col gap-0.5 text-[10px] text-slate-500">
        Rechnungsnr.
        <input type="text" name="invoice_number" placeholder="R-001" className="w-24 rounded border border-slate-300 px-1.5 py-1 text-xs" />
      </label>
      <label className="flex flex-col gap-0.5 text-[10px] text-slate-500">
        Netto (€) *
        <input type="number" name="amount_net" step="0.01" min="0" required className="w-24 rounded border border-slate-300 px-1.5 py-1 text-xs" />
      </label>
      <label className="flex flex-col gap-0.5 text-[10px] text-slate-500">
        MwSt %
        <input type="number" name="vat_rate" defaultValue={19} step="0.01" min="0" className="w-16 rounded border border-slate-300 px-1.5 py-1 text-xs" />
      </label>
      <div className="flex gap-1">
        <button type="submit" disabled={pending} className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          {pending ? "…" : "Einreichen"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
          Abbrechen
        </button>
      </div>
      {state.message && !state.success && (
        <p className="w-full text-xs text-red-600">{state.message}</p>
      )}
    </form>
  );
}
