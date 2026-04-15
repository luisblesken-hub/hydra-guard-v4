import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { statusColor, statusLabel } from "@/lib/utils/claim-status";

const CATEGORY_DE: Record<string, string> = {
  pipe_burst: "Rohrbruch", appliance_leak: "Geräteschaden",
  human_error: "Menschliches Versehen", roof_leak: "Dachleck", unknown: "Unbekannt",
};

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: me } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") redirect("/dashboard/owner");

  const sp = await searchParams;
  const statusFilter = sp.status ?? "all";
  const q = (sp.q ?? "").trim().toLowerCase();
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  let query = admin
    .from("damage_reports")
    .select("id, status, category, estimated_amount, created_at, owner_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: claims, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Alle Schadensfälle</h1>
        <div className="flex gap-2">
          <a href="/api/admin/claims/export"
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            CSV Export
          </a>
          <Link href="/dashboard/admin" className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            ← Admin
          </Link>
        </div>
      </div>

      <p className="text-sm text-slate-500">{count ?? 0} Fälle gesamt</p>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {["all", "submitted", "dispatched", "in_remediation", "invoice_submitted", "invoice_approved", "closed", "rejected"].map((s) => (
          <Link key={s}
            href={s === "all" ? "/dashboard/admin/claims" : `/dashboard/admin/claims?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusFilter === s ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s === "all" ? "Alle" : statusLabel(s)}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2">Kategorie</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Betrag</th>
              <th className="px-4 py-2">Datum</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Seite {page} von {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/dashboard/admin/claims?status=${statusFilter}&page=${page - 1}`}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                ← Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/dashboard/admin/claims?status=${statusFilter}&page=${page + 1}`}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                Weiter →
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
