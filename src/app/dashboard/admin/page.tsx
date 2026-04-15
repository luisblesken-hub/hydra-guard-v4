import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { statusColor, statusLabel } from "@/lib/utils/claim-status";
import { UserRoleSelect } from "@/components/admin/user-row";
import { CreateTestUsersButton, CreateSampleClaimButton } from "@/components/admin/create-test-users-button";

const CATEGORY_DE: Record<string, string> = {
  pipe_burst: "Rohrbruch",
  appliance_leak: "Geräteschaden",
  human_error: "Menschliches Versagen",
  roof_leak: "Dachleck",
  unknown: "Unbekannt",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/dashboard/owner");

  const [
    { count: totalReports },
    { count: totalUsers },
    { count: totalInvoices },
    { data: recentReports },
    { data: allUsers },
  ] = await Promise.all([
    admin.from("damage_reports").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("sanierer_invoices").select("*", { count: "exact", head: true }),
    admin
      .from("damage_reports")
      .select("id, status, category, estimated_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("profiles")
      .select("id, email, role, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Admin-Konsole</h1>
        <p className="text-sm text-slate-500">Systemübersicht · HydraGuard V4</p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Schadensfälle", value: totalReports ?? 0, color: "text-indigo-600" },
          { label: "Nutzer", value: totalUsers ?? 0, color: "text-emerald-600" },
          { label: "Rechnungen", value: totalInvoices ?? 0, color: "text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* System-Links */}
      <div className="flex flex-wrap gap-3">
        <a href="/api/admin/health" target="_blank" rel="noreferrer"
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
          🔍 System-Health
        </a>
        <a href="/api/admin/users/export"
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
          📊 Nutzer-CSV
        </a>
      </div>

      {/* Testdaten */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Dev-Tools</h2>
        <p className="mb-3 text-xs text-slate-500">
          Test-Daten für Smoke-Tests anlegen.
        </p>
        <div className="flex flex-wrap gap-4">
          <CreateTestUsersButton />
          <CreateSampleClaimButton />
        </div>
      </section>

      {/* User-Management */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Nutzer & Rollen</h2>
          <a
            href="/api/admin/users/export"
            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            CSV Export
          </a>
        </div>
          <p className="text-xs text-slate-500">
            Rollen anpassen per Dropdown – Änderungen werden sofort gespeichert.
          </p>
        </div>
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-0 border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2">E-Mail</th>
                <th className="px-4 py-2">Rolle</th>
                <th className="px-4 py-2">Zuletzt aktualisiert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(allUsers ?? []).map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-700">
                    {u.email ?? <span className="text-slate-400">—</span>}
                    <p className="font-mono text-[10px] text-slate-400">{u.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-2">
                    <UserRoleSelect userId={u.id} currentRole={u.role ?? null} />
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {u.updated_at
                      ? new Intl.DateTimeFormat("de-DE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(u.updated_at))
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Letzte Schadensmeldungen</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Kategorie</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Betrag</th>
              <th className="px-4 py-2">Datum</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(recentReports ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs text-slate-400">{r.id.slice(0, 8)}…</td>
                <td className="px-4 py-2 text-slate-700">{CATEGORY_DE[r.category] ?? r.category}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(r.status)}`}>
                    {statusLabel(r.status)}
                  </span>
                </td>
                <td className="px-4 py-2 font-semibold text-slate-800">
                  {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(r.estimated_amount)}
                </td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {new Intl.DateTimeFormat("de-DE", { dateStyle: "short" }).format(new Date(r.created_at))}
                </td>
                <td className="px-4 py-2">
                  <Link href={`/claims/${r.id}`} className="text-xs text-indigo-600 hover:underline">Details →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
