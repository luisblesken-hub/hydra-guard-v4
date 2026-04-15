import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { statusColor, statusLabel } from "@/lib/utils/claim-status";
import { AssignmentCardActions } from "@/components/assignments/assignment-card-actions";
import { QuickInvoiceForm } from "@/components/assignments/quick-invoice-form";
import { ScheduleAppointmentForm } from "@/components/assignments/schedule-appointment-form";
import Link from "next/link";

const CATEGORY_DE: Record<string, string> = {
  pipe_burst: "Rohrbruch",
  appliance_leak: "Geräteschaden",
  human_error: "Menschliches Versagen",
  roof_leak: "Dachleck",
  unknown: "Unbekannt",
};

const ASSIGNMENT_STATUS_DE: Record<string, string> = {
  pending: "Ausstehend",
  accepted: "Angenommen",
  in_progress: "In Arbeit",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

const ASSIGNMENT_STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  in_progress: "bg-emerald-100 text-emerald-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
};

type AssignmentRow = {
  id: string;
  status: string;
  scheduled_start: string | null;
  notes: string | null;
  fast_pay: boolean;
  report: {
    id: string;
    status: string;
    category: string;
    estimated_amount: number;
    confirmed_cause: string | null;
    reported_cause: string | null;
    created_at: string;
    property: {
      street: string | null;
      city: string | null;
      postal_code: string | null;
    } | null;
  } | null;
  invoice: {
    id: string;
    status: string;
    amount_gross: number | null;
    amount_net: number;
  } | null;
};

export default async function SaniererDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Rolle prüfen
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "sanierer") redirect("/dashboard/owner");

  // Aufträge des Sanierers inkl. Schadensdaten + Rechnungen
  const { data: assignments } = await admin
    .from("assignments")
    .select("id, status, scheduled_start, notes, fast_pay, report_id")
    .eq("sanierer_id", user.id)
    .order("created_at", { ascending: false });

  const rows: AssignmentRow[] = [];

  for (const a of assignments ?? []) {
    // Report + Property
    const { data: report } = await admin
      .from("damage_reports")
      .select(
        "id, status, category, estimated_amount, confirmed_cause, reported_cause, created_at, property_id"
      )
      .eq("id", a.report_id)
      .maybeSingle();

    let property = null;
    if (report?.property_id) {
      const { data: prop } = await admin
        .from("properties")
        .select("street, city, postal_code")
        .eq("id", report.property_id)
        .maybeSingle();
      property = prop;
    }

    // Neueste Rechnung zu diesem Auftrag
    const { data: invoiceData } = await admin
      .from("sanierer_invoices")
      .select("id, status, amount_gross, amount_net")
      .eq("assignment_id", a.id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    rows.push({
      id: a.id,
      status: a.status,
      scheduled_start: a.scheduled_start,
      notes: a.notes,
      fast_pay: a.fast_pay,
      report: report
        ? {
            id: report.id,
            status: report.status,
            category: report.category,
            estimated_amount: report.estimated_amount,
            confirmed_cause: report.confirmed_cause,
            reported_cause: report.reported_cause,
            created_at: report.created_at,
            property,
          }
        : null,
      invoice: invoiceData ?? null,
    });
  }

  const total = rows.length;
  const open = rows.filter(
    (r) => r.status === "pending" || r.status === "accepted" || r.status === "in_progress"
  ).length;

  // Umsatz aus bezahlten Rechnungen
  const { data: paidInvoices } = await admin
    .from("sanierer_invoices")
    .select("amount_gross, amount_net")
    .eq("sanierer_id", user.id)
    .eq("status", "paid");
  const totalRevenue = (paidInvoices ?? []).reduce(
    (s, i) => s + (i.amount_gross ?? i.amount_net ?? 0), 0
  );

  const { data: pendingInvoices } = await admin
    .from("sanierer_invoices")
    .select("amount_gross, amount_net")
    .eq("sanierer_id", user.id)
    .in("status", ["submitted", "approved"]);
  const pendingRevenue = (pendingInvoices ?? []).reduce(
    (s, i) => s + (i.amount_gross ?? i.amount_net ?? 0), 0
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Meine Aufträge
          </h1>
          <p className="text-sm text-slate-500">
            {total === 0
              ? "Noch keine Aufträge vorhanden."
              : `${open} offene · ${total} gesamt`}
          </p>
        </div>
      </header>

      {total > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{total}</p>
            <p className="text-xs text-slate-500">Aufträge gesamt</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-amber-600">{open}</p>
            <p className="text-xs text-slate-500">Aktiv</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">
              {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(totalRevenue)}
            </p>
            <p className="text-xs text-slate-500">Umsatz (bezahlt)</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-indigo-600">
              {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(pendingRevenue)}
            </p>
            <p className="text-xs text-slate-500">Ausstehend</p>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Du hast noch keine Aufträge erhalten.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {[...rows]
            // Pending + accepted oben, dann rest
            .sort((a, b) => {
              const priority = (s: string) =>
                s === "pending" ? 0 : s === "accepted" ? 1 : s === "in_progress" ? 2 : 3;
              return priority(a.status) - priority(b.status);
            })
            .map((row) => {
            const report = row.report;
            const address = report?.property
              ? [
                  report.property.street,
                  report.property.city,
                  report.property.postal_code,
                ]
                  .filter(Boolean)
                  .join(", ")
              : "—";

            return (
              <li
                key={row.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Left: Adresse + Kategorie */}
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold text-slate-900">{address}</p>
                    <p className="text-sm text-slate-500">
                      {CATEGORY_DE[report?.category ?? ""] ??
                        report?.category ??
                        "—"}
                      {row.scheduled_start && (
                        <>
                          {" · "}
                          {new Intl.DateTimeFormat("de-DE", {
                            dateStyle: "medium",
                          }).format(new Date(row.scheduled_start))}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Right: Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        ASSIGNMENT_STATUS_STYLE[row.status] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ASSIGNMENT_STATUS_DE[row.status] ?? row.status}
                    </span>
                    {report && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(
                          report.status
                        )}`}
                      >
                        {statusLabel(report.status)}
                      </span>
                    )}
                    {row.fast_pay && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Fast Pay
                      </span>
                    )}
                  </div>
                </div>

                {/* Confirmed Cause */}
                {(report?.confirmed_cause || report?.reported_cause) && (
                  <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    {report.confirmed_cause ? (
                      <p>
                        <span className="font-medium text-slate-700">
                          Bestätigte Ursache:{" "}
                        </span>
                        <span className="text-slate-600">
                          {report.confirmed_cause}
                        </span>
                      </p>
                    ) : (
                      <p>
                        <span className="font-medium text-slate-500">
                          Gemeldete Ursache:{" "}
                        </span>
                        <span className="text-slate-500 italic">
                          {report.reported_cause}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {/* Betrag + Rechnung */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-slate-600">
                    Schadenbetrag:{" "}
                    <span className="font-semibold text-slate-900">
                      {new Intl.NumberFormat("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      }).format(report?.estimated_amount ?? 0)}
                    </span>
                  </p>

                  {row.invoice ? (
                    <span className="text-xs text-slate-500">
                      Rechnung:{" "}
                      <span className="font-medium capitalize">
                        {row.invoice.status === "submitted"
                          ? "Eingereicht"
                          : row.invoice.status === "approved"
                            ? "Freigegeben ✓"
                            : row.invoice.status === "paid"
                              ? "Bezahlt ✓"
                              : row.invoice.status === "rejected"
                                ? "Abgelehnt ✗"
                                : row.invoice.status}
                      </span>
                      {" · "}
                      {new Intl.NumberFormat("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      }).format(
                        row.invoice.amount_gross ?? row.invoice.amount_net
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Keine Rechnung eingereicht
                    </span>
                  )}
                </div>

                {/* Actions */}
                {report && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/claims/${report.id}`}
                      className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Schadenakte →
                    </Link>
                    <ScheduleAppointmentForm
                      assignmentId={row.id}
                      scheduledStart={row.scheduled_start}
                    />
                  </div>
                )}
                {report && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <AssignmentCardActions
                      assignmentId={row.id}
                      reportId={report.id}
                      currentStatus={row.status}
                      hasConfirmedCause={Boolean(report.confirmed_cause)}
                    />
                    <ScheduleAppointmentForm
                      assignmentId={row.id}
                      scheduledStart={row.scheduled_start}
                    />
                  </div>
                )}
                {report && (row.status === "in_progress" || row.status === "completed") && (
                  <div className="mt-2">
                    <QuickInvoiceForm
                      reportId={report.id}
                      hasInvoice={row.invoice !== null}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
