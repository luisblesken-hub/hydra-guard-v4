"use client";

import { useActionState } from "react";
import { createPropertyAction, type PropertyState } from "./property-actions";

const INITIAL: PropertyState = {};

export function NewPropertyForm() {
  const [state, formAction, pending] = useActionState(createPropertyAction, INITIAL);

  if (state.success && state.propertyId) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-800">✓ Objekt angelegt!</p>
        <a
          href={`/properties/${state.propertyId}`}
          className="mt-3 inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Zum Objekt →
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-slate-600">
          Bezeichnung *
          <input type="text" name="label" required maxLength={200} placeholder="z.B. Musterstraße 1, Aachen — EG"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {state.fieldErrors?.label && <p className="text-red-600">{state.fieldErrors.label[0]}</p>}
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Straße + Hausnr.
          <input type="text" name="street" maxLength={200} placeholder="Musterstraße 1"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Postleitzahl *
          <input type="text" name="postal_code" required pattern="\d{5}" maxLength={5} placeholder="52062"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {state.fieldErrors?.postal_code && <p className="text-red-600">{state.fieldErrors.postal_code[0]}</p>}
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Stadt *
          <input type="text" name="city" required maxLength={100} placeholder="Aachen"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {state.fieldErrors?.city && <p className="text-red-600">{state.fieldErrors.city[0]}</p>}
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Gebäudetyp
          <select name="building_type" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">— optional —</option>
            <option value="Einfamilienhaus">Einfamilienhaus</option>
            <option value="Mehrfamilienhaus">Mehrfamilienhaus</option>
            <option value="Gewerbe">Gewerbe</option>
            <option value="Wohnung">Eigentumswohnung</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Versicherungsname
          <input type="text" name="insurer_name" maxLength={200} placeholder="z.B. Allianz"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>

        <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-slate-600">
          Policennummer
          <input type="text" name="policy_number" maxLength={100} placeholder="Pol.-Nr. (optional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
      </div>

      {state.message && !state.success && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <button type="submit" disabled={pending}
        className="w-full rounded-md bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50">
        {pending ? "Wird angelegt…" : "Objekt anlegen"}
      </button>
    </form>
  );
}
