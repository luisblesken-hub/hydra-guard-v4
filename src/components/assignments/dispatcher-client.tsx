"use client";

import { useActionState, useState } from "react";
import { assignSaniererAction, type DispatcherState } from "./dispatcher-actions";

const INITIAL: DispatcherState = {};

const STATUS_DE: Record<string, string> = {
  pending: "Ausstehend",
  accepted: "Angenommen",
  in_progress: "In Arbeit",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

export function DispatcherClient({
  reportId,
  sanierer,
  existingAssignments,
}: {
  reportId: string;
  sanierer: { id: string; email: string | null; specializations?: string[]; radius_km?: number; availability_status?: string }[];
  existingAssignments: {
    id: string;
    status: string;
    sanierer_id: string;
    sanierer_email: string | null;
    created_at: string;
  }[];
}) {
  const [state, formAction, pending] = useActionState(
    assignSaniererAction,
    INITIAL,
  );
  const [selected, setSelected] = useState("");

  const assignedIds = new Set(existingAssignments.map((a) => a.sanierer_id));
  const available = sanierer.filter((s) => !assignedIds.has(s.id));

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">
        Sanierer-Beauftragung
      </h2>

      {existingAssignments.length > 0 && (
        <ul className="space-y-2">
          {existingAssignments.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-slate-800">
                  {a.sanierer_email ?? "Sanierer"}
                </p>
                <p className="text-xs text-slate-500">
                  Beauftragt am{" "}
                  {new Intl.DateTimeFormat("de-DE", { dateStyle: "short" }).format(
                    new Date(a.created_at),
                  )}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                {STATUS_DE[a.status] ?? a.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      {available.length === 0 ? (
        <p className="text-xs text-slate-400">
          {existingAssignments.length > 0
            ? "Alle verfügbaren Sanierer sind zugewiesen."
            : "Aktuell sind keine Sanierer im System registriert."}
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="reportId" value={reportId} />
          <label className="flex flex-1 flex-col gap-1 text-xs text-slate-600">
            Sanierer auswählen
            <select
              name="saniererId"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              required
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">— bitte wählen —</option>
              {available.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.email ?? s.id.slice(0, 8)}
                  {s.availability_status === "busy" ? " (ausgelastet)" : ""}
                  {s.availability_status === "unavailable" ? " (nicht verfügbar)" : ""}
                  {s.radius_km ? ` · ${s.radius_km}km` : ""}
                  {s.specializations?.length ? ` · ${s.specializations.slice(0, 2).join(", ")}` : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={pending || !selected}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "…" : "Beauftragen"}
          </button>
        </form>
      )}

      {state.message && (
        <p
          className={`text-xs ${
            state.success ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {state.message}
        </p>
      )}
    </section>
  );
}
