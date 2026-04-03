'use server'
// GDPR: Handles personal claim data (owner identity, property, damage details).
// Legal basis: Art. 6(1)(b) DSGVO. Retention: 8 years (GoBD).

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createClaim, ensureProperty } from '@/lib/db/damage-reports'

const EXPERT_TRACK_THRESHOLD = 5_000
const OUT_OF_SCOPE_THRESHOLD = 15_000

const Schema = z.object({
  estimated_amount: z.coerce
    .number()
    .positive('Bitte einen Betrag eingeben.')
    .max(500_000, 'Maximalbetrag: 500.000 €'),
  category: z.enum(['pipe_burst', 'appliance_leak', 'human_error', 'roof_leak', 'unknown']),
  habitability_status: z.enum(['fully_habitable', 'limited', 'uninhabitable']),
  postal_code: z.string().regex(/^\d{5}$/, 'Ungültige Postleitzahl.'),
  city: z.string().min(2, 'Bitte Ort eingeben.').max(100),
  description: z.string().max(5000).optional(),
  reported_cause: z.string().max(2000).optional(),
  has_contents_damage: z.enum(['yes', 'no', 'unknown']),
  contents_insurer_name: z.string().max(200).optional(),
  contents_policy_number: z.string().max(100).optional(),
})

export type ClaimFormState = {
  success?: boolean
  message?: string
  fieldErrors?: Record<string, string[]>
  claimTier?: string
}

export async function createClaimAction(
  _prev: ClaimFormState,
  formData: FormData
): Promise<ClaimFormState> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const parsed = Schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      message: 'Bitte korrigiere die markierten Felder.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const {
    estimated_amount, category, habitability_status,
    postal_code, city, description, reported_cause,
    has_contents_damage, contents_insurer_name, contents_policy_number,
  } = parsed.data

  const claimTier =
    estimated_amount > OUT_OF_SCOPE_THRESHOLD ? 'out_of_scope' :
    estimated_amount > EXPERT_TRACK_THRESHOLD ? 'expert_track' :
    'auto_track'

  const propertyResult = await ensureProperty(supabase, {
    owner_id: user.id,
    postal_code,
    city,
  })
  if (propertyResult.error) {
    return { success: false, message: propertyResult.error }
  }
  if (!propertyResult.data) {
    return { success: false, message: 'Fehler beim Anlegen der Liegenschaft.' }
  }
  const claimResult = await createClaim(supabase, {
    property_id: propertyResult.data.id,
    owner_id: user.id,
    estimated_amount,
    category,
    description,
    reported_cause,
    habitability_status,
    has_contents_damage: has_contents_damage === 'yes',
    contents_insurer_name: has_contents_damage === 'yes' ? contents_insurer_name : undefined,
    contents_policy_number: has_contents_damage === 'yes' ? contents_policy_number : undefined,
    liability_involved: category === 'human_error' || category === 'appliance_leak',
  })

  if (claimResult.error) {
    return { success: false, message: claimResult.error }
  }

  revalidatePath('/claims')
  return {
    success: true,
    claimTier,
    message:
      claimTier === 'out_of_scope'
        ? 'Meldung eingereicht. Aufgrund der Schadenshöhe übernimmt ein Gutachter die Bearbeitung.'
        : 'Schadenmeldung erfolgreich eingereicht.',
  }
}

