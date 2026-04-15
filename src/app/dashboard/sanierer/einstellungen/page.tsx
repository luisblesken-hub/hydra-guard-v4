import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SaniererProfileForm } from "./profile-form";

export default async function SaniererEinstellungenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "sanierer") redirect("/dashboard/sanierer");

  const { data: poolProfile } = await admin
    .from("sanierer_pool_profiles")
    .select("id, specializations, radius_km, availability_status")
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <Link href="/dashboard/sanierer" className="-mb-2 text-sm text-slate-500 hover:text-slate-700">
        ← Zurück zu Aufträgen
      </Link>
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Profil-Einstellungen</h1>
        <p className="text-sm text-slate-500">
          Spezialisierungen und Verfügbarkeit für den Sanierer-Pool.
        </p>
      </header>
      <SaniererProfileForm
        userId={user.id}
        initialData={poolProfile ?? null}
      />
    </main>
  );
}
