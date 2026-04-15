import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { statusColor, statusLabel } from "@/lib/utils/claim-status";
import { UserRoleSelect } from "@/components/admin/user-row";

const ROLE_LABEL: Record<string, string> = {
  owner: "Eigentümer",
  sanierer: "Sanierer",
  versicherung: "Versicherung",
  mieter: "Mieter",
  admin: "Admin",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: me } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") redirect("/dashboard/owner");

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, role, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();

  // Claims des Nutzers (nur wenn Owner)
  const { data: claims } = await admin
    .from("damage_reports")
    .select("id, status, category, estimated_amount, created_at")
    .eq("owner_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Assignments (wenn Sanierer)
  const { count: assignmentCount } = await admin
    .from("assignments")
    .select("*", { count: "exact", head: true })
    .eq("sanierer_id", id);

  const CATEGORY_DE: Record<string, string> = {
    pipe_burst: "Rohrbruch", appliance_leak: "Geräteschaden",
    human_error: "Menschliches Versehen", roof_leak: "Dachleck", unknown: "Unbekannt",
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <Link href="/dashboard/admin" className="-mb-2 text-sm text-slate-500 hover:text-slate-700">
        ← Zurück zum Admin
      </Link>

      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xl font-semibold text-slate-900">{profile.email ?? "—"}</p>
            <p className="font-mono text-xs text-slate-400">{profile.id}</p>
          </div>
          <UserRoleSelect userId={profile.id} currentRole={profile.role ?? null} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-bold text-slate-900">{ROLE_LABEL[profile.role ?? ""] ?? profile.role ?? "—"}</p>
            <p className="text-xs text-slate-500">Rolle</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-bold text-slate-900">{(claims ?? []).length}</p>
            <p className="text-xs text-slate-500">Schadensfälle</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-bold text-slate-900">{assignmentCount ?? 0}</p>
            <p className="text-xs text-slate-500">Aufträge</p>
          </div>
        </div>
      </header>

      {(claims ?? []).length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Letzte Schadensfälle</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {(claims ?? []).map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-700">{CATEGORY_DE[c.category] ?? c.category}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(c.status)}`}>
                      {statusLabel(c.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-semibold text-slate-800">
                    {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(c.estimated_amount)}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {new Intl.DateTimeFormat("de-DE", { dateStyle: "short" }).format(new Date(c.created_at))}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/claims/${c.id}`} className="text-xs text-indigo-600 hover:underline">Detail →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
