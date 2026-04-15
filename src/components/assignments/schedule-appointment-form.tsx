"use client";

import { useActionState, useState } from "react";
import { scheduleAppointmentAction, type AppointmentState } from "./schedule-appointment-action";

const INITIAL: AppointmentState = {};

export function ScheduleAppointmentForm({
  assignmentId,
  scheduledStart,
}: {
  assignmentId: string;
  scheduledStart: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(scheduleAppointmentAction, INITIAL);

  const today = new Date().toISOString().slice(0, 10);

  if (state.success) {
    return <span className="text-xs text-emerald-600">✓ Termin gespeichert</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        📅 {scheduledStart
          ? new Intl.DateTimeFormat("de-DE", { dateStyle: "short" }).format(new Date(scheduledStart))
          : "Termin festlegen"}
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap gap-2 items-end">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <label className="flex flex-col gap-0.5 text-[10px] text-slate-500">
        Start *
        <input
          type="date"
          name="scheduled_start"
          required
          min={today}
          defaultValue={scheduledStart?.slice(0, 10) ?? today}
          className="rounded border border-slate-300 px-1.5 py-1 text-xs"
        />
      </label>
      <label className="flex flex-col gap-0.5 text-[10px] text-slate-500">
        Ende (optional)
        <input
          type="date"
          name="scheduled_end"
          min={today}
          className="rounded border border-slate-300 px-1.5 py-1 text-xs"
        />
      </label>
      <div className="flex gap-1">
        <button type="submit" disabled={pending} className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          {pending ? "…" : "Speichern"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
          ✕
        </button>
      </div>
      {state.message && <p className="w-full text-xs text-red-600">{state.message}</p>}
    </form>
  );
}
