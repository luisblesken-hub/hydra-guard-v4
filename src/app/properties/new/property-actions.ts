"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type PropertyState = {
  success?: boolean;
  message?: string;
  propertyId?: string;
  fieldErrors?: Record<string, string[]>;
};

const Schema = z.object({
  label: z.string().min(2, "Mindestens 2 Zeichen.").max(200),
  street: z.string().max(200).optional(),
  postal_code: z.string().regex(/^\d{5}$/, "Ungültige PLZ."),
  city: z.string().min(2, "Pflichtfeld.").max(100),
  building_type: z.string().max(100).optional(),
  insurer_name: z.string().max(200).optional(),
  policy_number: z.string().max(100).optional(),
});

export async function createPropertyAction(
  _prev: PropertyState,
  formData: FormData,
): Promise<PropertyState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: "Bitte korrigiere die Felder.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { label, street, postal_code, city, building_type, insurer_name, policy_number } = parsed.data;
  const admin = createAdminClient();

  const { data: property, error } = await admin
    .from("properties")
    .insert({
      owner_id: user.id,
      label,
      street: street || null,
      postal_code,
      city,
      building_type: building_type || null,
      insurer_name: insurer_name || null,
      policy_number: policy_number || null,
    })
    .select("id")
    .single();

  if (error || !property) {
    return { success: false, message: error?.message ?? "Fehler beim Anlegen." };
  }

  return { success: true, propertyId: property.id };
}
