import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { InsurerInvoiceActions } from "@/components/invoices/insurer-invoice-actions";

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

export default async function InsurerDashboardPage() {
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

  // Alle Rechnungen mit Status submitted, approved, rejected, paid
  const { data: invoices } = await admin
    .from("sanierer_invoices")
    .select(
      "id, report_id, invoice_number, amount_net, amount_gross, vat_rate, status, submitted_at, approved_at, paid_at"
    )
    .order("submitted_at", { ascending: false });

  // Reports für Adressen
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

  // Properties
  const propertyIds = [...new Set(Object.values(reportMap).map((r) => r.property_id).filter(Boolean))];
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
    const address = prop
      ? [prop.street, prop.city].filter(Boolean).join(", ")
      : "—";
    return {
      ...inv,
      address,
      claim_status: report?.status ?? "—",
    } as InvoiceRow;
  });

  const pending = rows.filter((r) => r.status === "approved").length;
  const totalApproved = rows
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + (r.amount_gross ?? r.amount_net), 0);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">Rechnungen</h1>
        <p className="text-sm text-slate-500">
          {pending > 0 ? (
            <span className="font-medium text-amber-600">
              {pending} Rechnung{pending === 1 ? "" : "en"} freigegeben, ausstehende Zahlung
              {" "}({formatEUR(totalApproved)}) · {" "}
            </span>
          ) : null}
          {rows.length} Rechnungen insgesamt
        </p>
      </header>

      {/* Zusammenfassung */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            { label: "Eingereicht", key: "submitted", color: "bg-blue-50 text-blue-700" },
            { label: "Freigegeben", key: "approved", color: "bg-emerald-50 text-emerald-700" },
            { label: "Bezahlt", key: "paid", color: "bg-green-50 text-green-700" },
            { label: "Abgelehnt", key: "rejected", color: "bg-red-50 text-red-700" },
          ] as const
        ).map(({ label, key, color }) => {
          const count = rows.filter((r) => r.status === key).length;
          return (
            <div key={key} className={`rounded-xl p-4 ${color}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium">{label}</p>
            </div>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Noch keine Rechnungen vorhanden.
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
                    {row.invoice_number ?? `#${row.id.slice(0, 8)}`}
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
