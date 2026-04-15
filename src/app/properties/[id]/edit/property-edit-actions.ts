"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type PropertyEditState = { success?: boolean; message?: string };

const Schema = z.object({
  propertyId: z.string().uuid(),
  label: z.string().min(2).max(200),
  street: z.string().max(200).optional(),
  postal_code: z.string().regex(/^\d{5}$/),
  city: z.string().min(2).max(100),
  building_type: z.string().max(100).optional(),
  insurer_name: z.string().max(200).optional(),
  policy_number: z.string().max(100).optional(),
});

export async function updatePropertyAction(
  _prev: PropertyEditState,
  formData: FormData,
): Promise<PropertyEditState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Ungültige Eingabe." };

  const { propertyId, label, street, postal_code, city, building_type, insurer_name, policy_number } = parsed.data;
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .maybeSingle();

  if (!existing || existing.owner_id !== user.id) return { success: false, message: "Keine Berechtigung." };

  const { error } = await admin
    .from("properties")
    .update({
      label,
      street: street || null,
      postal_code,
      city,
      building_type: building_type || null,
      insurer_name: insurer_name || null,
      policy_number: policy_number || null,
    })
    .eq("id", propertyId);

  if (error) return { success: false, message: error.message };

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/edit`);
  return { success: true };
}
