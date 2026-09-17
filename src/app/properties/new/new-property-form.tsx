"use client";

import { useActionState } from "react";
import { createPropertyAction, type PropertyState } from "./property-actions";
import { PostalCityFields } from "@/components/forms/postal-city-fields";

const INITIAL: PropertyState = {};

export function NewPropertyForm() {
  const [state, formAction, pending] = useActionState(createPropertyAction, INITIAL);

  if (state.success && state.propertyId) {
    return (
      <div className="rounded-xl border border-hg-line bg-slate-50 p-6 text-center">
        <p className="text-lg font-semibold text-hg-ink">Objekt angelegt</p>
        <a
          href={`/properties/${state.propertyId}`}
          className="mt-3 inline-flex items-center rounded-md bg-hg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-hg-steel"
        >
          Zum Objekt →
        </a>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-hg-line bg-white p-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-slate-600">
          Bezeichnung *
          <input
            type="text"
            name="label"
            required
            maxLength={200}
            placeholder="z.B. Musterstraße 1, Aachen — EG"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {state.fieldErrors?.label && (
            <p className="text-red-600">{state.fieldErrors.label[0]}</p>
          )}
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Straße + Hausnr.
          <input
            type="text"
            name="street"
            maxLength={200}
            placeholder="Musterstraße 1"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <PostalCityFields
          postalError={state.fieldErrors?.postal_code?.[0]}
          cityError={state.fieldErrors?.city?.[0]}
        />

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Gebäudetyp
          <select
            name="building_type"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— optional —</option>
            <option value="Einfamilienhaus">Einfamilienhaus</option>
            <option value="Mehrfamilienhaus">Mehrfamilienhaus</option>
            <option value="Gewerbe">Gewerbe</option>
            <option value="Wohnung">Eigentumswohnung</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Versicherungsname
          <input
            type="text"
            name="insurer_name"
            maxLength={200}
            placeholder="z.B. Allianz"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-slate-600">
          Policennummer
          <input
            type="text"
            name="policy_number"
            maxLength={100}
            placeholder="Pol.-Nr. (optional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {state.message && !state.success && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-hg-ink py-2.5 text-sm font-semibold text-white hover:bg-hg-steel disabled:opacity-50"
      >
        {pending ? "Wird angelegt…" : "Objekt anlegen"}
      </button>
    </form>
  );
}
