"use client";

import { useActionState } from "react";
import { updatePropertyAction, type PropertyEditState } from "./property-edit-actions";

type Property = {
  id: string;
  label: string;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  building_type: string | null;
  insurer_name: string | null;
  policy_number: string | null;
};

const INITIAL: PropertyEditState = {};

export function PropertyEditForm({ property }: { property: Property }) {
  const [state, formAction, pending] = useActionState(updatePropertyAction, INITIAL);

  if (state.success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
        ✓ Gespeichert.{" "}
        <a href={`/properties/${property.id}`} className="underline">Zurück zum Objekt</a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="propertyId" value={property.id} />

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        Bezeichnung *
        <input type="text" name="label" required defaultValue={property.label}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Straße
          <input type="text" name="street" defaultValue={property.street ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          PLZ *
          <input type="text" name="postal_code" required pattern="\d{5}" defaultValue={property.postal_code ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Stadt *
          <input type="text" name="city" required defaultValue={property.city ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Gebäudetyp
          <select name="building_type" defaultValue={property.building_type ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">— optional —</option>
            <option value="Einfamilienhaus">Einfamilienhaus</option>
            <option value="Mehrfamilienhaus">Mehrfamilienhaus</option>
            <option value="Gewerbe">Gewerbe</option>
            <option value="Wohnung">Eigentumswohnung</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Versicherung
          <input type="text" name="insurer_name" defaultValue={property.insurer_name ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Policennr.
          <input type="text" name="policy_number" defaultValue={property.policy_number ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
      </div>

      {state.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button type="submit" disabled={pending}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
        {pending ? "Speichert…" : "Speichern"}
      </button>
    </form>
  );
}
