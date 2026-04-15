import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PropertyEditForm } from "./property-edit-form";

export default async function PropertyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: property } = await admin
    .from("properties")
    .select("id, owner_id, label, street, city, postal_code, building_type, insurer_name, policy_number")
    .eq("id", id)
    .maybeSingle();

  if (!property || property.owner_id !== user.id) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-8">
      <Link href={`/properties/${id}`} className="-mb-2 text-sm text-slate-500 hover:text-slate-700">
        ← Zurück zum Objekt
      </Link>
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Objekt bearbeiten</h1>
      </header>
      <PropertyEditForm property={property} />
    </main>
  );
}
