// GDPR: Displays personal claim data for the authenticated owner.
// RLS enforces row-level access. Defense-in-depth: explicit owner_id filter.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClaimsByOwner } from '@/lib/db/damage-reports'
import { CreateClaimForm } from './create-claim-form'

const STATUS_DE: Record<string, string> = {
  draft: 'Entwurf', submitted: 'Eingereicht', validating: 'In Prüfung',
  calculating: 'Kalkulation', reviewing: 'In Freigabe', approved: 'Freigegeben',
  dispatched: 'Beauftragt', in_remediation: 'In Sanierung',
  invoice_submitted: 'Rechnung eingereicht', invoice_approved: 'Rechnung freigegeben',
  closed: 'Abgeschlossen', rejected: 'Abgelehnt', out_of_scope: 'Gutachter beauftragt',
}

const TIER_STYLE: Record<string, string> = {
  auto_track:   'bg-green-100 text-green-700',
  expert_track: 'bg-yellow-100 text-yellow-700',
  out_of_scope: 'bg-red-100 text-red-700',
}

const TIER_DE: Record<string, string> = {
  auto_track: 'Auto', expert_track: 'Experte', out_of_scope: 'Gutachter',
}

export default async function ClaimsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: claims, error: claimsError } = await getClaimsByOwner(supabase, user.id)

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-12">
      <section>
        <h1 className="text-2xl font-bold mb-1">Schaden melden</h1>
        <p className="text-sm text-gray-500 mb-6">
          Für Schäden zwischen €500 und €15.000 übernehmen wir die vollständige Abwicklung.
        </p>
        <CreateClaimForm />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Meine Schadenmeldungen</h2>

        {claimsError && (
          <p className="text-red-600 text-sm">{claimsError}</p>
        )}

        {!claims || claims.length === 0 ? (
          <p className="text-gray-400 text-sm">Noch keine Schadenmeldungen vorhanden.</p>
        ) : (
          <div className="divide-y border rounded-lg overflow-hidden">
            {claims.map((c) => (
              <div key={c.id}
                className="p-4 hover:bg-gray-50 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-400">{c.id.slice(0, 8)}…</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_STYLE[c.claim_tier] ?? ''}`}>
                      {TIER_DE[c.claim_tier] ?? c.claim_tier}
                    </span>
                    {c.displacement_required && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Auszug</span>
                    )}
                    {c.has_contents_damage && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">+ Hausrat</span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{STATUS_DE[c.status] ?? c.status}</p>
                  <p className="text-xs text-gray-400">
                    {new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' })
                      .format(new Date(c.created_at))}
                  </p>
                </div>
                <p className="font-semibold text-sm">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
                    .format(c.estimated_amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

