"use client";

import { useActionState } from "react";
import { saveSaniererProfileAction, type SaniererProfileState } from "./profile-actions";

const SPECS = [
  "Wasserschaden", "Schimmelbeseitigung", "Trocknung", "Rohrsanierung",
  "Dachreparatur", "Abdichtung", "Estrich", "Malerarbeiten",
];

const AVAILABILITY = [
  { value: "available", label: "Verfügbar" },
  { value: "busy", label: "Ausgelastet" },
  { value: "unavailable", label: "Nicht verfügbar" },
];

const INITIAL: SaniererProfileState = {};

export function SaniererProfileForm({
  userId,
  initialData,
}: {
  userId: string;
  initialData: {
    id?: string;
    specializations: string[];
    radius_km: number;
    availability_status: string;
  } | null;
}) {
  const [state, formAction, pending] = useActionState(saveSaniererProfileAction, INITIAL);

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="userId" value={userId} />

      <div>
        <p className="text-sm font-medium text-slate-700">Verfügbarkeit</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {AVAILABILITY.map((a) => (
            <label key={a.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="availability_status"
                value={a.value}
                defaultChecked={(initialData?.availability_status ?? "available") === a.value}
              />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Einsatzradius (km)
        </label>
        <input
          type="number"
          name="radius_km"
          min={1}
          max={500}
          defaultValue={initialData?.radius_km ?? 50}
          className="mt-1 block w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700">Spezialisierungen</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SPECS.map((spec) => (
            <label key={spec} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="specializations"
                value={spec}
                defaultChecked={initialData?.specializations?.includes(spec) ?? false}
                className="rounded"
              />
              {spec}
            </label>
          ))}
        </div>
      </div>

      {state.message && (
        <p className={`text-sm ${state.success ? "text-emerald-600" : "text-red-600"}`}>
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "Speichert…" : "Profil speichern"}
      </button>
    </form>
  );
}
