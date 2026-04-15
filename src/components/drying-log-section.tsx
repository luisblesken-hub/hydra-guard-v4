"use client";

import { useActionState, useEffect, useState } from "react";
import { addDryingLogEntry, type DryingLogFormState } from "./drying-log-actions";
import { DryingLogChart } from "./drying-log-chart";

export type DryingLogEntry = {
  id: string;
  recorded_at: string;
  moisture_percent: number | null;
  room_label: string | null;
  equipment_notes: string | null;
};

function formatTimestamp(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

const initial: DryingLogFormState = {};

export function DryingLogSection({
  reportId,
  initialEntries,
}: {
  reportId: string;
  initialEntries: DryingLogEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [state, action, pending] = useActionState(addDryingLogEntry, initial);

  useEffect(() => {
    if (state.success && state.entry) {
      setEntries((prev) => [...prev, state.entry!]);
    }
  }, [state]);

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">
        Trocknungsprotokoll
      </h2>

      {entries.length === 0 ? (
        <p className="text-xs text-slate-500">
          Noch keine Einträge vorhanden.
        </p>
      ) : (
        <>
        <DryingLogChart entries={entries} />
        <ol className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="relative border-l-2 border-slate-200 pl-4"
            >
              <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-slate-400" />
              <p className="text-xs text-slate-500">
                {formatTimestamp(entry.recorded_at)}
              </p>
              <p className="text-sm font-medium text-slate-900">
                {entry.moisture_percent != null
                  ? `${entry.moisture_percent} % rF`
                  : "—"}
                {entry.room_label ? ` · ${entry.room_label}` : ""}
              </p>
              {entry.equipment_notes && (
                <p className="text-xs text-slate-600">
                  {entry.equipment_notes}
                </p>
              )}
            </li>
          ))}
        </ol>
        </>
      )}

      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Eintrag hinzufügen
        </summary>

        <form action={action} className="mt-3 space-y-3">
          <input type="hidden" name="reportId" value={reportId} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="moisture_percent"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Messwert
              </label>
              <input
                id="moisture_percent"
                name="moisture_percent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                placeholder="z.B. 65.5"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="unit"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Einheit
              </label>
              <input
                id="unit"
                name="unit"
                type="text"
                defaultValue="% rF"
                disabled
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="room_label"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Raum (optional)
            </label>
            <input
              id="room_label"
              name="room_label"
              type="text"
              maxLength={200}
              placeholder="z.B. Badezimmer EG"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="equipment_notes"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Notizen (optional)
            </label>
            <textarea
              id="equipment_notes"
              name="equipment_notes"
              rows={2}
              maxLength={2000}
              placeholder="z.B. Trocknungsgerät Modell XY aufgestellt..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          {state.message && !state.success && (
            <p className="text-xs text-red-600">{state.message}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? "Speichern…" : "Eintrag speichern"}
          </button>
        </form>
      </details>
    </section>
  );
}
