import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ClaimEditForm } from "./claim-edit-form";
import Link from "next/link";

export default async function ClaimEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: claim } = await admin
    .from("damage_reports")
    .select("id, owner_id, category, habitability_status, estimated_amount, description, reported_cause, building_insurer_name, building_policy_number, contents_insurer_name, contents_policy_number, liability_insurer_name, status")
    .eq("id", id)
    .maybeSingle();

  if (!claim || claim.owner_id !== user.id) notFound();

  // Nur editierbar wenn noch nicht dispatched
  const locked = ["dispatched", "in_remediation", "invoice_submitted", "invoice_approved", "closed"].includes(claim.status);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <Link href={`/claims/${id}`} className="-mb-2 text-sm text-slate-500 hover:text-slate-700">
        ← Zurück zur Schadensakte
      </Link>
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Schaden bearbeiten</h1>
        {locked && (
          <p className="mt-1 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Dieser Fall ist bereits beauftragt — nur Beschreibung und Versicherungsinfos können noch geändert werden.
          </p>
        )}
      </header>
      <ClaimEditForm claim={claim} locked={locked} />
    </main>
  );
}
