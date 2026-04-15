import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { statusColor, statusLabel } from "@/lib/utils/claim-status";

const CATEGORY_DE: Record<string, string> = {
  pipe_burst: "Rohrbruch",
  appliance_leak: "Geräteschaden",
  human_error: "Menschliches Versagen",
  roof_leak: "Dachleck",
  unknown: "Unbekannt",
};

type ClaimRow = {
  id: string;
  status: string;
  category: string;
  estimated_amount: number;
  created_at: string;
  owner_id: string;
  property: { street: string | null; city: string | null } | null;
  invoice_count: number;
  latest_invoice_status: string | null;
  latest_invoice_amount: number | null;
};

export default async function InsuranceDashboardPage() {
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

  // Alle Schadensfälle ab Status "in_remediation" aufwärts — relevant für Versicherung
  const RELEVANT_STATUSES = [
    "in_remediation",
    "invoice_submitted",
    "invoice_approved",
    "closed",
  ];

  const { data: reports } = await admin
    .from("damage_reports")
    .select("id, status, category, estimated_amount, created_at, owner_id, property_id")
    .in("status", RELEVANT_STATUSES)
    .order("created_at", { ascending: false });

  // Properties
  const propertyIds = [...new Set((reports ?? []).map((r) => r.property_id).filter(Boolean))];
  type PropRow = { id: string; street: string | null; city: string | null };
  let propMap: Record<string, PropRow> = {};
  if (propertyIds.length > 0) {
    const { data: props } = await admin
      .from("properties")
      .select("id, street, city")
      .in("id", propertyIds);
    propMap = Object.fromEntries((props ?? []).map((p) => [p.id, p]));
  }

  // Rechnungen pro Report
  const reportIds = (reports ?? []).map((r) => r.id);
  type InvRow = {
    report_id: string;
    status: string;
    amount_gross: number | null;
    amount_net: number;
  };
  let invoiceMap: Record<string, InvRow[]> = {};
  if (reportIds.length > 0) {
    const { data: invoices } = await admin
      .from("sanierer_invoices")
      .select("report_id, status, amount_gross, amount_net")
      .in("report_id", reportIds)
      .order("submitted_at", { ascending: false });

    for (const inv of invoices ?? []) {
      if (!invoiceMap[inv.report_id]) invoiceMap[inv.report_id] = [];
      invoiceMap[inv.report_id].push(inv as InvRow);
    }
  }

  const rows: ClaimRow[] = (reports ?? []).map((r) => {
    const invs = invoiceMap[r.id] ?? [];
    return {
      id: r.id,
      status: r.status,
      category: r.category,
      estimated_amount: r.estimated_amount,
      created_at: r.created_at,
      owner_id: r.owner_id,
      property: propMap[r.property_id] ?? null,
      invoice_count: invs.length,
      latest_invoice_status: invs[0]?.status ?? null,
      latest_invoice_amount: invs[0]?.amount_gross ?? invs[0]?.amount_net ?? null,
    };
  });

  const awaitingPayment = rows.filter((r) => r.latest_invoice_status === "approved").length;
  const total = rows.length;
  const inRemediation = rows.filter((r) => r.status === "in_remediation").length;
  const totalDamage = rows.reduce((s, r) => s + (r.estimated_amount ?? 0), 0);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">Schadensfälle</h1>
        <p className="text-sm text-slate-500">
          {awaitingPayment > 0 ? (
            <span className="font-medium text-amber-600">
              {awaitingPayment} Rechnung{awaitingPayment === 1 ? "" : "en"} warten auf Zahlung ·{" "}
            </span>
          ) : null}
          {total} relevante Fälle insgesamt
        </p>
      </header>

      {total > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-3xl font-bold text-slate-900">{total}</p>
            <p className="text-xs text-slate-500">Fälle gesamt</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-3xl font-bold text-amber-600">{awaitingPayment}</p>
            <p className="text-xs text-slate-500">Zahlung ausstehend</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-3xl font-bold text-emerald-600">{inRemediation}</p>
            <p className="text-xs text-slate-500">In Sanierung</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-3xl font-bold text-slate-600">
              {new Intl.NumberFormat("de-DE", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              }).format(totalDamage)}
            </p>
            <p className="text-xs text-slate-500">Schadensvolumen gesamt</p>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Noch keine relevanten Schadensfälle vorhanden.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Objekt / Kategorie</th>
                <th className="px-4 py-3">Schadenstatus</th>
                <th className="px-4 py-3">Schadensbetrag</th>
                <th className="px-4 py-3">Rechnung</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const address = row.property
                  ? [row.property.street, row.property.city]
                      .filter(Boolean)
                      .join(", ")
                  : "—";
                return (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{address}</p>
                      <p className="text-xs text-slate-500">
                        {CATEGORY_DE[row.category] ?? row.category}
                        {" · "}
                        {new Intl.DateTimeFormat("de-DE", {
                          dateStyle: "short",
                        }).format(new Date(row.created_at))}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(
                          row.status
                        )}`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {new Intl.NumberFormat("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      }).format(row.estimated_amount)}
                    </td>
                    <td className="px-4 py-3">
                      {row.latest_invoice_status ? (
                        <div>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              row.latest_invoice_status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : row.latest_invoice_status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : row.latest_invoice_status === "submitted"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {row.latest_invoice_status === "submitted"
                              ? "Eingereicht"
                              : row.latest_invoice_status === "approved"
                                ? "Freigegeben"
                                : row.latest_invoice_status === "paid"
                                  ? "Bezahlt"
                                  : row.latest_invoice_status}
                          </span>
                          {row.latest_invoice_amount && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {new Intl.NumberFormat("de-DE", {
                                style: "currency",
                                currency: "EUR",
                              }).format(row.latest_invoice_amount)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/claims/${row.id}`}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
