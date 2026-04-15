'use client'

import { useActionState, useState } from 'react'
import { createClaimAction, type ClaimFormState } from './actions'

const initial: ClaimFormState = {}

const CATEGORY_LABELS: Record<string, string> = {
  pipe_burst:    'Rohrbruch (Gebäudedefekt)',
  appliance_leak:'Haushaltsgerät (Waschmaschine, Geschirrspüler)',
  human_error:   'Menschliches Versehen (offener Hahn etc.)',
  roof_leak:     'Dachleck',
  unknown:       'Unbekannt / Noch nicht geprüft',
}

const HABITABILITY_LABELS: Record<string, string> = {
  fully_habitable: 'Voll bewohnbar',
  limited:         'Eingeschränkt (einzelne Räume betroffen)',
  uninhabitable:   'Nicht bewohnbar (Auszug notwendig)',
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="text-red-600 text-xs mt-1">{errors[0]}</p>
}

const EXPERT_TRACK_THRESHOLD = 5_000;
const OUT_OF_SCOPE_THRESHOLD = 15_000;

function getTier(amount: number): { label: string; color: string; desc: string } | null {
  if (!amount || amount <= 0) return null;
  if (amount > OUT_OF_SCOPE_THRESHOLD) return {
    label: "Gutachter-Track",
    color: "bg-red-50 border-red-200 text-red-700",
    desc: "Schadenhöhe erfordert externen Gutachter. Kein automatischer Workflow.",
  };
  if (amount > EXPERT_TRACK_THRESHOLD) return {
    label: "Experten-Track",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    desc: "Manuelle Prüfung durch Versicherungsexperten.",
  };
  return {
    label: "Auto-Track",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    desc: "Automatischer Workflow — schnelle Bearbeitung.",
  };
}

export function CreateClaimForm() {
  const [state, action, pending] = useActionState(createClaimAction, initial)
  const [contents, setContents] = useState('no')
  const [amount, setAmount] = useState('')

  const num = parseFloat(amount) || 0
  const tier = getTier(num)

  if (state.success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 max-w-xl">
        <p className="font-semibold text-green-800">{state.message}</p>
        {state.claimTier === 'out_of_scope' && (
          <p className="text-sm text-green-700 mt-2">
            Wir erstellen eine vollständige Dokumentation für Ihren Versicherer.
          </p>
        )}
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5 max-w-xl">

      <div>
        <label htmlFor="estimated_amount" className="block text-sm font-medium mb-1">
          Geschätzter Schadensbetrag (€) *
        </label>
        <input
          id="estimated_amount" name="estimated_amount"
          type="number" step="100" min="1" max="500000"
          value={amount} onChange={e => setAmount(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm" required
        />
        {tier && (
          <div className={`mt-2 rounded-md border px-3 py-2 text-xs ${tier.color}`}>
            <span className="font-semibold">{tier.label}</span> — {tier.desc}
          </div>
        )}
        <FieldError errors={state.fieldErrors?.estimated_amount} />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">
          Schadensursache *
        </label>
        <select id="category" name="category"
          className="w-full border rounded px-3 py-2 text-sm" required>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <FieldError errors={state.fieldErrors?.category} />
      </div>

      <div>
        <label htmlFor="habitability_status" className="block text-sm font-medium mb-1">
          Bewohnbarkeit *
        </label>
        <select id="habitability_status" name="habitability_status"
          className="w-full border rounded px-3 py-2 text-sm" required>
          {Object.entries(HABITABILITY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <FieldError errors={state.fieldErrors?.habitability_status} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="postal_code" className="block text-sm font-medium mb-1">PLZ *</label>
          <input id="postal_code" name="postal_code" type="text"
            pattern="\d{5}" maxLength={5} placeholder="52062"
            className="w-full border rounded px-3 py-2 text-sm" required />
          <FieldError errors={state.fieldErrors?.postal_code} />
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-1">Ort *</label>
          <input id="city" name="city" type="text" placeholder="Aachen"
            className="w-full border rounded px-3 py-2 text-sm" required />
          <FieldError errors={state.fieldErrors?.city} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Persönliche Gegenstände beschädigt?
        </label>
        <select name="has_contents_damage" value={contents}
          onChange={e => setContents(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm">
          <option value="no">Nein, nur das Gebäude</option>
          <option value="yes">Ja, eigene Gegenstände betroffen</option>
          <option value="unknown">Noch nicht sicher</option>
        </select>
        {contents === 'yes' && (
          <div className="mt-3 space-y-2 rounded border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-700">
              Wir dokumentieren Ihren Hausratschaden für Ihre eigene Versicherung.
              Hydra Guard wickelt ausschließlich den Gebäudeschaden ab.
            </p>
            <input name="contents_insurer_name" type="text"
              placeholder="Hausratversicherung (optional)"
              className="w-full border rounded px-3 py-2 text-sm" />
            <input name="contents_policy_number" type="text"
              placeholder="Versicherungsnummer (optional)"
              className="w-full border rounded px-3 py-2 text-sm" />
          </div>
        )}
        {contents === 'unknown' && (
          <p className="text-xs text-gray-500 mt-1">
            Kein Problem — kann nachgetragen werden solange der Fall offen ist.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="reported_cause" className="block text-sm font-medium mb-1">
          Vermutete Ursache (optional)
        </label>
        <textarea id="reported_cause" name="reported_cause"
          rows={2} maxLength={2000}
          placeholder="z.B. Rohrbruch unter der Badewanne, Wasserfleck an der Decke aufgefallen..."
          className="w-full border rounded px-3 py-2 text-sm" />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Beschreibung (optional)
        </label>
        <textarea id="description" name="description"
          rows={3} maxLength={5000}
          placeholder="Kurze Beschreibung der Situation..."
          className="w-full border rounded px-3 py-2 text-sm" />
      </div>

      {state.message && !state.success && (
        <p className="text-sm text-red-600 font-medium">{state.message}</p>
      )}

      <button type="submit" disabled={pending}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded text-sm transition-colors">
        {pending ? 'Wird eingereicht…' : 'Schaden melden'}
      </button>
    </form>
  )
}

