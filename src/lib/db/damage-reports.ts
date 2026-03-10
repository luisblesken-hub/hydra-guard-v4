// GDPR: This module accesses personal data (owner identity, property address,
// damage descriptions, insurance details).
// Legal basis: Art. 6(1)(b) DSGVO — contract performance.
// Retention: 8 years (GoBD). Never log personal data to console.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Client = SupabaseClient<Database>

// ─── Result type ────────────────────────────────────────────────────────────

export type DbResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }

// ─── Input types ────────────────────────────────────────────────────────────

export type CreateClaimInput = {
  property_id: string
  owner_id: string
  estimated_amount: number
  category: Database['public']['Enums']['damage_category']
  description?: string
  habitability_status?: Database['public']['Enums']['habitability_status']
  has_contents_damage?: boolean
  contents_insurer_name?: string
  contents_policy_number?: string
  liability_involved?: boolean
}

export type EnsurePropertyInput = {
  owner_id: string
  postal_code: string
  city: string
  street?: string
  building_type?: string
}

// ─── Output types ───────────────────────────────────────────────────────────

export type ClaimSummary = {
  id: string
  status: string
  claim_tier: string
  estimated_amount: number
  category: string
  habitability_status: string
  has_contents_damage: boolean
  liability_involved: boolean
  displacement_required: boolean
  complexity_flags: string[]
  created_at: string
}

export type ClaimDetail = ClaimSummary & {
  description: string | null
  escalation_reason: string | null
  contents_insurer_name: string | null
  contents_policy_number: string | null
  liability_insurer_name: string | null
  building_insurer_name: string | null
  displacement_start_date: string | null
  displacement_end_date: string | null
  property_id: string
  submitted_at: string | null
}

// ─── Functions ──────────────────────────────────────────────────────────────

export async function ensureProperty(
  supabase: Client,
  input: EnsurePropertyInput
): Promise<DbResult<{ id: string }>> {
  // Reuse existing property at same address to avoid duplicates
  const { data: existing } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', input.owner_id)
    .eq('postal_code', input.postal_code)
    .eq('city', input.city)
    .maybeSingle()

  if (existing) return { data: { id: existing.id }, error: null }

  const { data, error } = await supabase
    .from('properties')
    .insert({
      owner_id: input.owner_id,
      label: `${input.city}, ${input.postal_code}`,
      postal_code: input.postal_code,
      city: input.city,
      street: input.street ?? null,
      building_type: input.building_type ?? null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[ensureProperty] insert error:', error.code)
    return { data: null, error: 'Fehler beim Anlegen der Liegenschaft.' }
  }

  return { data: { id: data.id }, error: null }
}

export async function createClaim(
  supabase: Client,
  input: CreateClaimInput
): Promise<DbResult<{ id: string }>> {
  const { data, error } = await supabase
    .from('damage_reports')
    .insert({
      property_id: input.property_id,
      owner_id: input.owner_id,
      estimated_amount: input.estimated_amount,
      category: input.category,
      description: input.description ?? null,
      habitability_status: input.habitability_status ?? 'fully_habitable',
      has_contents_damage: input.has_contents_damage ?? false,
      contents_insurer_name: input.contents_insurer_name ?? null,
      contents_policy_number: input.contents_policy_number ?? null,
      liability_involved: input.liability_involved ?? false,
      status: 'submitted',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createClaim] insert error:', error.code)
    return { data: null, error: 'Fehler beim Speichern der Schadenmeldung.' }
  }

  return { data: { id: data.id }, error: null }
}

// Backwards-compatible alias for existing code paths.
export async function createDamageReport(
  supabase: Client,
  input: CreateClaimInput
): Promise<DbResult<{ id: string }>> {
  return createClaim(supabase, input)
}

export async function getClaimsByOwner(
  supabase: Client,
  owner_id: string
): Promise<DbResult<ClaimSummary[]>> {
  const { data, error } = await supabase
    .from('damage_reports')
    .select(`
      id, status, claim_tier, estimated_amount, category,
      habitability_status, has_contents_damage, liability_involved,
      displacement_required, complexity_flags, created_at
    `)
    .eq('owner_id', owner_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getClaimsByOwner] error:', error.code)
    return { data: null, error: 'Fehler beim Laden der Schadenmeldungen.' }
  }

  return { data: data as ClaimSummary[], error: null }
}

export async function getClaimById(
  supabase: Client,
  id: string,
  owner_id: string
): Promise<DbResult<ClaimDetail>> {
  const { data, error } = await supabase
    .from('damage_reports')
    .select(`
      id, status, claim_tier, estimated_amount, category,
      habitability_status, has_contents_damage, liability_involved,
      displacement_required, complexity_flags, created_at,
      description, escalation_reason,
      contents_insurer_name, contents_policy_number,
      liability_insurer_name, building_insurer_name,
      displacement_start_date, displacement_end_date,
      property_id, submitted_at
    `)
    .eq('id', id)
    .eq('owner_id', owner_id)
    .single()

  if (error) {
    console.error('[getClaimById] error:', error.code)
    return { data: null, error: 'Schadenmeldung nicht gefunden.' }
  }

  return { data: data as ClaimDetail, error: null }
}

// Backwards-compatible alias for existing code paths.
export async function getMyDamageReports(
  supabase: Client,
  owner_id: string
): Promise<DbResult<ClaimSummary[]>> {
  return getClaimsByOwner(supabase, owner_id)
}

