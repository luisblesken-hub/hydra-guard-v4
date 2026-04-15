"use client";

import { useActionState, useState } from "react";
import { addDryingLogEntry, type DryingLogFormState } from "@/components/drying-log-actions";

const INITIAL: DryingLogFormState = {};

export function QuickDryingLog({ reportId }: { reportId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addDryingLogEntry, INITIAL);

  if (state.success && !open) {
    return <span className="text-xs text-emerald-600">✓ Messung gespeichert</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        💧 Messung erfassen
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap gap-2 items-end">
      <input type="hidden" name="reportId" value={reportId} />
      <label className="flex flex-col gap-0.5 text-[10px] text-slate-500">
        Feuchte % *
        <input
          type="number"
          name="moisture_percent"
          step="0.1"
          min="0"
          max="100"
          required
          className="w-20 rounded border border-slate-300 px-1.5 py-1 text-xs"
        />
      </label>
      <label className="flex flex-col gap-0.5 text-[10px] text-slate-500">
        Raum
        <input
          type="text"
          name="room_label"
          maxLength={100}
          placeholder="z.B. Bad"
          className="w-24 rounded border border-slate-300 px-1.5 py-1 text-xs"
        />
      </label>
      <div className="flex gap-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-cyan-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
        >
          {pending ? "…" : "Speichern"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
        >
          ✕
        </button>
      </div>
      {state.message && <p className="w-full text-xs text-red-600">{state.message}</p>}
    </form>
  );
}
