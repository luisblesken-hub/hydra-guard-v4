import { createAdminClient } from "@/lib/supabase/admin";
import { verifyClaimTrackingToken } from "@/lib/claims/tracking-token";
import { statusLabel } from "@/lib/utils/claim-status";
import { StatusStepper } from "@/components/claims/status-stepper";

export default async function PublicClaimStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const reportId = verifyClaimTrackingToken(token);

  if (!reportId) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Link ungültig oder abgelaufen</h1>
        <p className="mt-2 text-sm text-slate-600">
          Bitte nutzen Sie den Link aus Ihrer Bestätigung erneut oder wenden Sie sich an Ihre
          Hausverwaltung.
        </p>
      </main>
    );
  }

  const admin = createAdminClient();
  const { data: report } = await admin
    .from("damage_reports")
    .select(
      "id, status, category, estimated_amount, description, created_at, property_id, habitability_status"
    )
    .eq("id", reportId)
    .maybeSingle();

  if (!report) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Vorgang nicht gefunden</h1>
      </main>
    );
  }

  const { data: property } = await admin
    .from("properties")
    .select("street, city, postal_code, label")
    .eq("id", report.property_id)
    .maybeSingle();

  const address = property
    ? [property.street, property.postal_code, property.city].filter(Boolean).join(", ") ||
      property.label ||
      "—"
    : "—";

  const { data: assignment } = await admin
    .from("assignments")
    .select("scheduled_start, status, sanierer_id")
    .eq("report_id", reportId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let saniererLabel: string | null = null;
  if (assignment?.sanierer_id) {
    const { data: san } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", assignment.sanierer_id)
      .maybeSingle();
    saniererLabel = san?.full_name || san?.email || null;
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-slate-50 px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">HydraGuard</p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">Status Ihrer Meldung</h1>
      <p className="mt-1 text-sm text-slate-600">{address}</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-500">Aktueller Stand</p>
        <p className="text-lg font-semibold text-slate-900">{statusLabel(report.status)}</p>
        <div className="mt-4">
          <StatusStepper status={report.status} />
        </div>
      </div>

      <dl className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <div>
          <dt className="text-xs text-slate-500">Gemeldet am</dt>
          <dd className="font-medium text-slate-800">
            {new Intl.DateTimeFormat("de-DE", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(report.created_at))}
          </dd>
        </div>
        {report.estimated_amount > 0 && (
          <div>
            <dt className="text-xs text-slate-500">System-Schätzung</dt>
            <dd className="font-medium text-slate-800">
              {new Intl.NumberFormat("de-DE", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              }).format(report.estimated_amount)}
            </dd>
          </div>
        )}
        {saniererLabel && (
          <div>
            <dt className="text-xs text-slate-500">Sanierer</dt>
            <dd className="font-medium text-slate-800">{saniererLabel}</dd>
            {assignment?.scheduled_start && (
              <dd className="text-xs text-slate-500">
                Termin:{" "}
                {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(
                  new Date(assignment.scheduled_start)
                )}
              </dd>
            )}
          </div>
        )}
      </dl>

      <p className="mt-6 text-xs text-slate-500">
        Diese Seite ist schreibgeschützt und ohne Login erreichbar. Speichern Sie den Link — er
        bleibt ca. 90 Tage gültig.
      </p>
    </main>
  );
}
