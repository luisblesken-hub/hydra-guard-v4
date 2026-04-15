import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { InsurerInvoiceActions } from "@/components/invoices/insurer-invoice-actions";

function formatEUR(v: number | null | undefined) {
  if (!v && v !== 0) return "—";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v);
}

function formatDate(v: string | null | undefined) {
  if (!v) return "—";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeStyle: "short" }).format(new Date(v));
}

const STATUS_DE: Record<string, { label: string; color: string }> = {
  submitted: { label: "Eingereicht", color: "bg-blue-100 text-blue-800" },
  approved: { label: "Freigegeben", color: "bg-emerald-100 text-emerald-800" },
  paid: { label: "Bezahlt", color: "bg-green-100 text-green-800" },
  rejected: { label: "Abgelehnt", color: "bg-red-100 text-red-800" },
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "versicherung") redirect("/dashboard/insurer");

  const { data: invoice } = await admin
    .from("sanierer_invoices")
    .select("id, report_id, invoice_number, amount_net, amount_gross, vat_rate, status, submitted_at, approved_at, paid_at, sanierer_id, system_estimate, deviation_percent, nash_applied, fast_pay_applied, fast_pay_discount_percent")
    .eq("id", id)
    .maybeSingle();

  if (!invoice) notFound();

  // Report + Property
  const { data: report } = await admin
    .from("damage_reports")
    .select("id, status, category, estimated_amount, confirmed_cause, reported_cause, created_at, property_id")
    .eq("id", invoice.report_id)
    .maybeSingle();

  let address = "—";
  if (report?.property_id) {
    const { data: prop } = await admin
      .from("properties")
      .select("street, city, postal_code")
      .eq("id", report.property_id)
      .maybeSingle();
    if (prop) address = [prop.street, prop.postal_code, prop.city].filter(Boolean).join(", ");
  }

  // Sanierer
  const { data: saniererProfile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", invoice.sanierer_id)
    .maybeSingle();

  const invStatus = STATUS_DE[invoice.status] ?? { label: invoice.status, color: "bg-gray-100 text-gray-600" };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <Link href="/dashboard/insurer" className="-mb-2 text-sm text-slate-500 hover:text-slate-700">
        ← Zurück zu Rechnungen
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Rechnung {invoice.invoice_number ?? `#${invoice.id.slice(0, 8)}`}
          </h1>
          <p className="text-sm text-slate-500">{address}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${invStatus.color}`}>
          {invStatus.label}
        </span>
      </header>

      {/* Betragsübersicht */}
      <section className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Netto</p>
          <p className="text-xl font-bold text-slate-900">{formatEUR(invoice.amount_net)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">MwSt ({invoice.vat_rate}%)</p>
          <p className="text-xl font-bold text-slate-900">
            {formatEUR((invoice.amount_gross ?? 0) - invoice.amount_net)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Brutto</p>
          <p className="text-xl font-bold text-emerald-700">{formatEUR(invoice.amount_gross ?? invoice.amount_net)}</p>
        </div>
      </section>

      {/* Vergleich mit Schätzung */}
      {invoice.system_estimate && (
        <div className={`rounded-lg p-3 text-sm ${
          (invoice.deviation_percent ?? 0) > 20
            ? "bg-red-50 border border-red-200"
            : "bg-slate-50 border border-slate-200"
        }`}>
          <p className="font-medium text-slate-700">Vergleich mit System-Schätzung</p>
          <div className="mt-1 flex gap-6 text-xs text-slate-600">
            <span>Schätzung: {formatEUR(invoice.system_estimate)}</span>
            <span>Abweichung: {(invoice.deviation_percent ?? 0).toFixed(1)}%</span>
            {invoice.nash_applied && <span className="text-amber-600">NASH-Regel angewendet</span>}
            {invoice.fast_pay_applied && (
              <span className="text-emerald-600">
                FastPay {invoice.fast_pay_discount_percent}% Rabatt
              </span>
            )}
          </div>
        </div>
      )}

      {/* Zeitstempel */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Zeitverlauf</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Eingereicht</dt>
            <dd className="font-medium">{formatDate(invoice.submitted_at)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Freigegeben</dt>
            <dd className="font-medium">{formatDate(invoice.approved_at)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Bezahlt</dt>
            <dd className="font-medium">{formatDate(invoice.paid_at)}</dd>
          </div>
        </dl>
      </section>

      {/* Sanierer + Schadensfall */}
      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Sanierer</h2>
          <p className="mt-1 text-sm text-slate-700">{saniererProfile?.email ?? "—"}</p>
        </div>
        {report && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Schadensfall</h2>
            <p className="mt-1 text-sm text-slate-700">
              Schadenschätzung: {formatEUR(report.estimated_amount)}
            </p>
            {(report.confirmed_cause ?? report.reported_cause) && (
              <p className="mt-1 text-xs italic text-slate-500">
                {report.confirmed_cause ?? report.reported_cause}
              </p>
            )}
            <Link href={`/claims/${report.id}`} className="mt-1 inline-block text-xs text-indigo-600 hover:underline">
              Schadenakte öffnen →
            </Link>
          </div>
        )}
      </section>

      {/* Aktionen */}
      {invoice.status === "approved" && (
        <div className="flex gap-3">
          <InsurerInvoiceActions invoiceId={invoice.id} reportId={invoice.report_id} />
          <a
            href={`/api/claims/${invoice.report_id}/export/insurer`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            PDF Export
          </a>
        </div>
      )}
    </main>
  );
}
