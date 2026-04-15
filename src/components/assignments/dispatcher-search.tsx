"use client";

import { useState, useMemo } from "react";
import { assignSaniererAction, type DispatcherState } from "./dispatcher-actions";
import { useActionState } from "react";

const INITIAL: DispatcherState = {};

type Sanierer = {
  id: string;
  email: string | null;
  specializations?: string[];
  radius_km?: number;
  availability_status?: string;
};

const AVAIL_LABEL: Record<string, string> = {
  available: "Verfügbar",
  busy: "Ausgelastet",
  unavailable: "Nicht verfügbar",
};

const AVAIL_COLOR: Record<string, string> = {
  available: "text-emerald-600",
  busy: "text-amber-600",
  unavailable: "text-red-500",
};

export function DispatcherSearch({
  reportId,
  sanierer,
  existingAssignments,
}: {
  reportId: string;
  sanierer: Sanierer[];
  existingAssignments: { id: string; status: string; sanierer_id: string; sanierer_email: string | null; created_at: string }[];
}) {
  const [state, formAction, pending] = useActionState(assignSaniererAction, INITIAL);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState("");

  const assignedIds = new Set(existingAssignments.map((a) => a.sanierer_id));
  const available = useMemo(
    () =>
      sanierer
        .filter((s) => !assignedIds.has(s.id))
        .filter(
          (s) =>
            !q ||
            (s.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
            (s.specializations ?? []).some((sp) => sp.toLowerCase().includes(q.toLowerCase()))
        ),
    [sanierer, assignedIds, q]
  );

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Sanierer-Beauftragung</h2>

      {existingAssignments.length > 0 && (
        <ul className="space-y-1">
          {existingAssignments.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="font-medium text-slate-800">{a.sanierer_email ?? "—"}</span>
              <span className="text-xs text-slate-500 capitalize">{a.status}</span>
            </li>
          ))}
        </ul>
      )}

      {available.length === 0 && existingAssignments.length === 0 && (
        <p className="text-xs text-slate-400">Keine Sanierer im System registriert.</p>
      )}

      {sanierer.length > 3 && (
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sanierer suchen (Name, Spezialisierung)…"
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      )}

      {available.length > 0 && (
        <form action={formAction} className="space-y-2">
          <input type="hidden" name="reportId" value={reportId} />
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {available.map((s) => (
              <label
                key={s.id}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  selected === s.id ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="saniererId"
                  value={s.id}
                  required
                  className="mt-0.5"
                  onChange={() => setSelected(s.id)}
                />
                <div>
                  <p className="font-medium text-slate-800">{s.email ?? s.id.slice(0, 8)}</p>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {s.availability_status && (
                      <span className={`text-xs ${AVAIL_COLOR[s.availability_status] ?? "text-slate-500"}`}>
                        {AVAIL_LABEL[s.availability_status] ?? s.availability_status}
                      </span>
                    )}
                    {s.radius_km && <span className="text-xs text-slate-400">{s.radius_km} km</span>}
                    {s.specializations?.slice(0, 2).map((sp) => (
                      <span key={sp} className="rounded bg-slate-100 px-1.5 text-[10px] text-slate-600">{sp}</span>
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={pending || !selected}
            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "…" : "Beauftragen"}
          </button>
          {state.message && (
            <p className={`text-xs ${state.success ? "text-emerald-600" : "text-red-600"}`}>{state.message}</p>
          )}
        </form>
      )}
    </section>
  );
}
