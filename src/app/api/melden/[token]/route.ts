import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const admin = createAdminClient();

  const { data: property, error } = await admin
    .from("properties")
    .select("id, label, street, city, postal_code, unit_count")
    .eq("public_token", token)
    .maybeSingle();

  if (error || !property) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json({
    id: property.id,
    label: property.label,
    street: property.street,
    city: property.city,
    postal_code: property.postal_code,
    unit_count: property.unit_count,
  });
}

