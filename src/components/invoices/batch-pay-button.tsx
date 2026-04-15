"use client";

import { useActionState, useState } from "react";
import { batchMarkPaidAction, type BatchPayState } from "./batch-pay-actions";

const INITIAL: BatchPayState = {};

export function BatchPayButton({ approvedInvoiceIds }: { approvedInvoiceIds: string[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, formAction, pending] = useActionState(batchMarkPaidAction, INITIAL);

  if (approvedInvoiceIds.length === 0) return null;

  const allSelected = selected.size === approvedInvoiceIds.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(approvedInvoiceIds));
  }

  function toggle(id: string) {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  }

  if (state.success) {
    return (
      <div className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">
        ✓ {state.message}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-amber-800">
          {approvedInvoiceIds.length} freigegebene Rechnung(en) — Sammelzahlung
        </p>
        <label className="flex items-center gap-2 text-xs text-amber-700 cursor-pointer">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          Alle auswählen
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {approvedInvoiceIds.map((id) => (
          <label key={id} className="flex items-center gap-1 rounded-md border border-amber-200 bg-white px-2 py-1 text-xs cursor-pointer">
            <input type="checkbox" checked={selected.has(id)} onChange={() => toggle(id)} />
            #{id.slice(0, 8)}
          </label>
        ))}
      </div>

      <form action={formAction} className="flex items-center gap-3">
        <input type="hidden" name="invoiceIds" value={[...selected].join(",")} />
        <button
          type="submit"
          disabled={pending || selected.size === 0}
          className="inline-flex items-center rounded-md bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {pending ? "Wird verarbeitet…" : `${selected.size} als bezahlt markieren`}
        </button>
      </form>
      {state.message && !state.success && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}
    </div>
  );
}
