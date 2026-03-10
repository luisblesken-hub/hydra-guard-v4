import { createSupabaseServerClient } from "../supabase/server";

// Annahme: Owner = profiles.id = auth.uid(), Properties werden minimal erzeugt,
// solange noch kein vollwertiger Property-Flow existiert.

export type CreateDamageReportInput = {
  ownerId: string;
  estimatedAmount: number;
  category: "water" | "fire" | "storm" | "other";
  claimTier: "small" | "medium" | "large";
  city: string;
  postalCode: string;
};

export async function createDamageReport(input: CreateDamageReportInput) {
  const supabase = createSupabaseServerClient();

  // Minimal-Property anlegen (Stub), falls notwendig.
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .insert({
      owner_id: input.ownerId,
      partner_id: null,
      address_line: "",
      postal_code: input.postalCode,
      city: input.city,
      country: "DE",
      habitability: "ok",
    })
    .select("*")
    .single();

  if (propertyError || !property) {
    throw new Error(
      `Failed to create property: ${propertyError?.message ?? "Unknown error"}`
    );
  }

  const { data: report, error: reportError } = await supabase
    .from("damage_reports")
    .insert({
      property_id: property.id,
      owner_id: input.ownerId,
      category: input.category,
      claim_tier: input.claimTier,
      status: "submitted",
      estimated_amount: input.estimatedAmount,
      risk_score: null,
      forensic_flags: null,
    })
    .select("*")
    .single();

  if (reportError || !report) {
    throw new Error(
      `Failed to create damage report: ${
        reportError?.message ?? "Unknown error"
      }`
    );
  }

  return report;
}

export async function getMyDamageReports(ownerId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("damage_reports")
    .select("id, status, estimated_amount, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch damage reports: ${error.message}`);
  }

  // Rely on RLS; ownerId wird aktuell nur zur Signatur mitgegeben.
  return data ?? [];
}

export async function getDamageReportById(id: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("damage_reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch damage report: ${error.message}`);
  }

  return data;
}

