import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { InsurerInvoiceActions } from "@/components/invoices/insurer-invoice-actions";
import { BatchPayButton } from "@/components/invoices/batch-pay-button";

type InvoiceRow = {
  id: string;
  report_id: string;
  invoice_number: string | null;
  amount_net: number;
  amount_gross: number | null;
  vat_rate: number;
  status: string;
  submitted_at: string;
  approved_at: string | null;
  paid_at: string | null;
  address: string;
  claim_status: string;
};

function formatEUR(v: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v);
}

function formatDate(v: string | null) {
  if (!v) return "—";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(v));
}

export default async function InsurerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
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

  if (profile?.role !== "versicherung") redirect("/dashboard/owner");

  const params = await searchParams;
  const statusFilter = params.status ?? "all";

  let query = admin
    .from("sanierer_invoices")
    .select(
      "id, report_id, invoice_number, amount_net, amount_gross, vat_rate, status, submitted_at, approved_at, paid_at",
    )
    .order("submitted_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: invoices } = await query;

  const reportIds = [...new Set((invoices ?? []).map((i) => i.report_id))];
  type ReportMini = { id: string; status: string; property_id: string };
  let reportMap: Record<string, ReportMini> = {};
  if (reportIds.length > 0) {
    const { data: reports } = await admin
      .from("damage_reports")
      .select("id, status, property_id")
      .in("id", reportIds);
    reportMap = Object.fromEntries((reports ?? []).map((r) => [r.id, r as ReportMini]));
  }

  const propertyIds = [
    ...new Set(Object.values(reportMap).map((r) => r.property_id).filter(Boolean)),
  ];
  type PropRow = { id: string; street: string | null; city: string | null };
  let propMap: Record<string, PropRow> = {};
  if (propertyIds.length > 0) {
    const { data: props } = await admin
      .from("properties")
      .select("id, street, city")
      .in("id", propertyIds);
    propMap = Object.fromEntries((props ?? []).map((p) => [p.id, p as PropRow]));
  }

  const rows: InvoiceRow[] = (invoices ?? []).map((inv) => {
    const report = reportMap[inv.report_id];
    const prop = report ? propMap[report.property_id] : null;
    const address = prop ? [prop.street, prop.city].filter(Boolean).join(", ") : "—";
    return {
      ...inv,
      address,
      claim_status: report?.status ?? "—",
    } as InvoiceRow;
  });

  // Stats brauchen ALLE Rechnungen — separat querien wenn gefiltert
  const { data: allInvoices } =
    statusFilter === "all"
      ? { data: invoices }
      : await admin.from("sanierer_invoices").select("status, amount_gross, amount_net");

  type StatusStat = { submitted: number; approved: number; paid: number; rejected: number };
  const stats: StatusStat = {
    submitted: 0,
    approved: 0,
    paid: 0,
    rejected: 0,
  };
  let totalApproved = 0;
  for (const inv of allInvoices ?? []) {
    if (inv.status in stats) {
      stats[inv.status as keyof StatusStat]++;
      if (inv.status === "approved") {
        totalApproved += inv.amount_gross ?? inv.amount_net;
      }
    }
  }

  const filterOptions = [
    { key: "all", label: "Alle" },
    { key: "submitted", label: "Eingereicht" },
    { key: "approved", label: "Freigegeben" },
    { key: "paid", label: "Bezahlt" },
    { key: "rejected", label: "Abgelehnt" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-900">Rechnungen</h1>
          <p className="text-sm text-slate-500">
            {stats.approved > 0 ? (
              <span className="font-medium text-amber-600">
                {stats.approved} Rechnung{stats.approved === 1 ? "" : "en"} freigegeben, ausstehende Zahlung
                {" "}({formatEUR(totalApproved)}) · {" "}
              </span>
            ) : null}
            {rows.length} Rechnungen {statusFilter !== "all" ? "gefiltert" : "insgesamt"}
          </p>
        </div>
        {rows.length > 0 && (
          <a
            href="/api/insurer/invoices/export"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            📊 CSV-Export
          </a>
        )}
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            { label: "Eingereicht", key: "submitted", color: "bg-blue-50 text-blue-700" },
            { label: "Freigegeben", key: "approved", color: "bg-emerald-50 text-emerald-700" },
            { label: "Bezahlt", key: "paid", color: "bg-green-50 text-green-700" },
            { label: "Abgelehnt", key: "rejected", color: "bg-red-50 text-red-700" },
          ] as const
        ).map(({ label, key, color }) => {
          const count = stats[key];
          return (
            <div key={key} className={`rounded-xl p-4 ${color}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Batch-Zahlung wenn mehrere freigegeben */}
      {statusFilter === "all" && rows.filter((r) => r.status === "approved").length > 1 && (
        <BatchPayButton approvedInvoiceIds={rows.filter((r) => r.status === "approved").map((r) => r.id)} />
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <Link
            key={opt.key}
            href={opt.key === "all" ? "/dashboard/insurer" : `/dashboard/insurer?status=${opt.key}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusFilter === opt.key
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {statusFilter === "all"
            ? "Noch keine Rechnungen vorhanden."
            : "Keine Rechnungen mit diesem Filter."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Objekt</th>
                <th className="px-4 py-3">Rechnungsnr.</th>
                <th className="px-4 py-3">Betrag (brutto)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Freigegeben</th>
                <th className="px-4 py-3">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{row.address}</p>
                    <Link
                      href={`/claims/${row.report_id}`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Schadenakte →
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    <Link
                      href={`/dashboard/insurer/invoices/${row.id}`}
                      className="hover:text-indigo-600 hover:underline"
                    >
                      {row.invoice_number ?? `#${row.id.slice(0, 8)}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {formatEUR(row.amount_gross ?? row.amount_net)}
                    <p className="text-xs font-normal text-slate-500">
                      Netto {formatEUR(row.amount_net)} · {row.vat_rate}% MwSt
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : row.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : row.status === "submitted"
                              ? "bg-blue-100 text-blue-800"
                              : row.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {row.status === "submitted"
                        ? "Eingereicht"
                        : row.status === "approved"
                          ? "Freigegeben"
                          : row.status === "paid"
                            ? "Bezahlt"
                            : row.status === "rejected"
                              ? "Abgelehnt"
                              : row.status}
                    </span>
                    {row.paid_at && (
                      <p className="text-xs text-slate-400">{formatDate(row.paid_at)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(row.approved_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {row.status === "approved" && (
                        <InsurerInvoiceActions invoiceId={row.id} reportId={row.report_id} />
                      )}
                      <a
                        href={`/api/claims/${row.report_id}/export/insurer`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        PDF Export
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
