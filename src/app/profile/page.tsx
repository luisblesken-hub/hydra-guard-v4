import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopNav } from "@/components/layout/top-nav";

const ROLE_LABEL: Record<string, string> = {
  owner: "Eigentümer",
  sanierer: "Sanierer",
  versicherung: "Versicherung",
  mieter: "Mieter",
  admin: "Administrator",
};

const ROLE_DESCRIPTION: Record<string, string> = {
  owner: "Eigentümer/Verwalter — kann Schäden melden, Sanierer beauftragen und Rechnungen freigeben.",
  sanierer: "Sanierungsbetrieb — kann Aufträge annehmen, Trocknungsverlauf dokumentieren und Rechnungen einreichen.",
  versicherung: "Versicherung — kann Schäden prüfen und freigegebene Rechnungen bezahlen.",
  mieter: "Mieter — kann den eigenen Schadensfall einsehen (schreibgeschützt).",
  admin: "Administrator — Vollzugriff auf alle Schäden, Rechnungen und Nutzer.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, email, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as string | null) ?? null;
  const email = profile?.email ?? user.email ?? "";

  // Nutzer-Stats je nach Rolle
  let stats: { label: string; value: string }[] = [];

  if (role === "owner") {
    const { count: totalReports } = await admin
      .from("damage_reports")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id);
    const { count: totalProperties } = await admin
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id);
    stats = [
      { label: "Schadensfälle", value: String(totalReports ?? 0) },
      { label: "Liegenschaften", value: String(totalProperties ?? 0) },
    ];
  } else if (role === "sanierer") {
    const { count: totalAssignments } = await admin
      .from("assignments")
      .select("*", { count: "exact", head: true })
      .eq("sanierer_id", user.id);
    const { count: totalInvoices } = await admin
      .from("sanierer_invoices")
      .select("*", { count: "exact", head: true })
      .eq("sanierer_id", user.id);
    stats = [
      { label: "Aufträge", value: String(totalAssignments ?? 0) },
      { label: "Rechnungen", value: String(totalInvoices ?? 0) },
    ];
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav role={role} email={email} userId={user.id} />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Mein Profil</h1>
          <p className="text-sm text-slate-500">
            Persönliche Informationen und Rolle in HydraGuard.
          </p>
        </header>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
              {email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{email}</p>
              <p className="text-sm text-slate-500">
                {role ? ROLE_LABEL[role] ?? role : "Keine Rolle gesetzt"}
              </p>
            </div>
          </div>
          {role && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {ROLE_DESCRIPTION[role] ?? ""}
            </p>
          )}
        </section>

        {stats.length > 0 && (
          <section className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-3xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </section>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Konto-Details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">E-Mail</dt>
              <dd className="font-medium text-slate-800">{email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Nutzer-ID</dt>
              <dd className="font-mono text-xs text-slate-600">{user.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Rolle</dt>
              <dd className="font-medium text-slate-800">
                {role ? ROLE_LABEL[role] ?? role : "—"}
              </dd>
            </div>
            {profile?.updated_at && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Profil aktualisiert</dt>
                <dd className="text-slate-600">
                  {new Intl.DateTimeFormat("de-DE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(profile.updated_at))}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <div className="flex justify-between">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
            ← Zurück zum Dashboard
          </Link>
          <Link href="/settings/notifications" className="text-sm text-slate-500 hover:text-slate-700">
            🔔 Benachrichtigungen
          </Link>
        </div>
      </main>
    </div>
  );
}
