"use client";

import { useActionState } from "react";
import { updateClaimAction, type ClaimEditState } from "./claim-edit-actions";

type ClaimData = {
  id: string;
  category: string;
  habitability_status: string;
  estimated_amount: number;
  description: string | null;
  reported_cause: string | null;
  building_insurer_name: string | null;
  building_policy_number: string | null;
  contents_insurer_name: string | null;
  contents_policy_number: string | null;
  liability_insurer_name: string | null;
};

const INITIAL: ClaimEditState = {};

export function ClaimEditForm({ claim, locked }: { claim: ClaimData; locked: boolean }) {
  const [state, formAction, pending] = useActionState(updateClaimAction, INITIAL);

  if (state.success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
        ✓ Änderungen gespeichert.{" "}
        <a href={`/claims/${claim.id}`} className="underline">Zurück zur Akte</a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="reportId" value={claim.id} />

      {!locked && (
        <>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Kategorie
            <select name="category" defaultValue={claim.category} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="pipe_burst">Rohrbruch</option>
              <option value="appliance_leak">Geräteschaden</option>
              <option value="human_error">Menschliches Versagen</option>
              <option value="roof_leak">Dachleck</option>
              <option value="unknown">Unbekannt</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Bewohnbarkeit
            <select name="habitability_status" defaultValue={claim.habitability_status} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="fully_habitable">Vollständig bewohnbar</option>
              <option value="limited">Eingeschränkt bewohnbar</option>
              <option value="uninhabitable">Nicht bewohnbar</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Geschätzter Schaden (€)
            <input type="number" name="estimated_amount" step="0.01" defaultValue={claim.estimated_amount}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
        </>
      )}

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        Beschreibung
        <textarea name="description" rows={3} defaultValue={claim.description ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        Gemeldete Ursache
        <textarea name="reported_cause" rows={2} defaultValue={claim.reported_cause ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </label>

      <div className="space-y-3 rounded-lg bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-700">Versicherungsinfos</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Gebäudeversicherung
            <input type="text" name="building_insurer_name" defaultValue={claim.building_insurer_name ?? ""}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Policennr. (Gebäude)
            <input type="text" name="building_policy_number" defaultValue={claim.building_policy_number ?? ""}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Hausratversicherung
            <input type="text" name="contents_insurer_name" defaultValue={claim.contents_insurer_name ?? ""}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Policennr. (Hausrat)
            <input type="text" name="contents_policy_number" defaultValue={claim.contents_policy_number ?? ""}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-xs text-slate-600">
            Haftpflichtversicherung
            <input type="text" name="liability_insurer_name" defaultValue={claim.liability_insurer_name ?? ""}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </label>
        </div>
      </div>

      {state.message && !state.success && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <button type="submit" disabled={pending}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
        {pending ? "Speichert…" : "Änderungen speichern"}
      </button>
    </form>
  );
}
