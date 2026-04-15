import { redirect } from "next/navigation";
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

const HABITABILITY_DE: Record<string, string> = {
  fully_habitable: "Vollständig bewohnbar",
  limited: "Eingeschränkt bewohnbar",
  uninhabitable: "Nicht bewohnbar",
};

export default async function MieterDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Rolle prüfen
  const { data: profile } = await admin
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();

  // Mieter und Owner dürfen diese Seite sehen (Owner redirecten wir nicht)
  if (profile?.role === "sanierer") redirect("/dashboard/sanierer");
  if (profile?.role === "versicherung") redirect("/dashboard/insurance");
  if (profile?.role === "admin") redirect("/dashboard/admin");

  const tenantEmail = profile?.email ?? user.email ?? "";

  // Schadenfälle finden, zu denen der Mieter eingeladen wurde
  const { data: invitations } = await admin
    .from("damage_invitations")
    .select("report_id")
    .eq("email", tenantEmail);

  const reportIds = (invitations ?? []).map((i) => i.report_id);

  type ReportRow = {
    id: string;
    status: string;
    category: string;
    estimated_amount: number;
    habitability_status: string;
    confirmed_cause: string | null;
    reported_cause: string | null;
    description: string | null;
    created_at: string;
    displacement_required: boolean;
    displacement_start_date: string | null;
    displacement_end_date: string | null;
    property_id: string;
  };

  let reports: ReportRow[] = [];

  if (reportIds.length > 0) {
    const { data } = await admin
      .from("damage_reports")
      .select(
        `id, status, category, estimated_amount, habitability_status,
         confirmed_cause, reported_cause, description, created_at,
         displacement_required, displacement_start_date, displacement_end_date, property_id`
      )
      .in("id", reportIds)
      .order("created_at", { ascending: false });
    reports = (data ?? []) as ReportRow[];
  }

  // Properties für Adressen
  const propertyIds = [...new Set(reports.map((r) => r.property_id))];
  type PropertyRow = { id: string; street: string | null; city: string | null; postal_code: string | null };
  let properties: PropertyRow[] = [];
  if (propertyIds.length > 0) {
    const { data } = await admin
      .from("properties")
      .select("id, street, city, postal_code")
      .in("id", propertyIds);
    properties = (data ?? []) as PropertyRow[];
  }
  const propMap = Object.fromEntries(properties.map((p) => [p.id, p]));

  // Drying log pro Report
  type DryingEntry = {
    id: string;
    recorded_at: string;
    moisture_percent: number;
    room_label: string | null;
  };
  // Sanierer-Info + Termin pro Report
  type AssignmentInfo = {
    sanierer_email: string | null;
    scheduled_start: string | null;
    status: string;
  };
  const assignmentInfoMap: Record<string, AssignmentInfo> = {};

  const dryingMap: Record<string, DryingEntry[]> = {};
  if (reportIds.length > 0) {
    const { data: assignmentsData } = await admin
      .from("assignments")
      .select("id, report_id, sanierer_id, scheduled_start, status")
      .in("report_id", reportIds);

    // Sanierer-Emails
    const saniererIds = [...new Set((assignmentsData ?? []).map((a) => a.sanierer_id))];
    const saniererEmailMap: Record<string, string | null> = {};
    if (saniererIds.length > 0) {
      const { data: profs } = await admin.from("profiles").select("id, email").in("id", saniererIds);
      for (const p of profs ?? []) saniererEmailMap[p.id] = p.email;
    }
    for (const a of assignmentsData ?? []) {
      assignmentInfoMap[a.report_id] = {
        sanierer_email: saniererEmailMap[a.sanierer_id] ?? null,
        scheduled_start: a.scheduled_start,
        status: a.status,
      };
    }

    const assignmentIds = (assignmentsData ?? []).map((a) => a.id);
    const assignmentToReport = Object.fromEntries(
      (assignmentsData ?? []).map((a) => [a.id, a.report_id])
    );

    if (assignmentIds.length > 0) {
      const { data: dryingData } = await admin
        .from("drying_log_entries")
        .select("id, assignment_id, recorded_at, moisture_percent, room_label")
        .in("assignment_id", assignmentIds)
        .order("recorded_at", { ascending: false });

      for (const entry of dryingData ?? []) {
        const rid = assignmentToReport[entry.assignment_id];
        if (!rid) continue;
        if (!dryingMap[rid]) dryingMap[rid] = [];
        dryingMap[rid].push(entry as DryingEntry);
      }
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Mein Schaden</h1>
        <p className="text-sm text-slate-500">
          Lesezugriff auf Ihren Wasserschaden — alle Angaben sind schreibgeschützt.
        </p>
      </header>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Noch kein Schadenfall mit Ihrer E-Mail-Adresse verknüpft.
          <br />
          <span className="text-xs text-slate-400">
            Ihr Eigentümer muss Sie über die Schadenakte einladen.
          </span>
        </div>
      ) : (
        <ul className="flex flex-col gap-6">
          {reports.map((report) => {
            const prop = propMap[report.property_id];
            const address = prop
              ? [prop.street, prop.city, prop.postal_code].filter(Boolean).join(", ")
              : "—";
            const entries = dryingMap[report.id] ?? [];
            const latestMoisture = entries[0];

            return (
              <li
                key={report.id}
                className="rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{address}</p>
                    <p className="text-sm text-slate-500">
                      {CATEGORY_DE[report.category] ?? report.category}
                      {" · "}
                      {new Intl.DateTimeFormat("de-DE", {
                        dateStyle: "medium",
                      }).format(new Date(report.created_at))}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(
                      report.status
                    )}`}
                  >
                    {statusLabel(report.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-0 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                  {/* Schadendaten */}
                  <div className="space-y-3 p-4">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Schadendaten
                    </h2>

                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-xs text-slate-500">Bewohnbarkeit</dt>
                        <dd className="font-medium text-slate-800">
                          {HABITABILITY_DE[report.habitability_status] ??
                            report.habitability_status}
                        </dd>
                      </div>

                      {report.confirmed_cause ? (
                        <div>
                          <dt className="text-xs text-slate-500">Bestätigte Schadensursache</dt>
                          <dd className="font-medium text-slate-800">
                            {report.confirmed_cause}
                          </dd>
                        </div>
                      ) : report.reported_cause ? (
                        <div>
                          <dt className="text-xs text-slate-500">Gemeldete Ursache</dt>
                          <dd className="italic text-slate-600">{report.reported_cause}</dd>
                        </div>
                      ) : null}

                      {report.description && (
                        <div>
                          <dt className="text-xs text-slate-500">Beschreibung</dt>
                          <dd className="text-slate-600">{report.description}</dd>
                        </div>
                      )}

                      {report.displacement_required && (
                        <div className="rounded-md bg-amber-50 px-3 py-2">
                          <dt className="text-xs font-semibold text-amber-700">
                            Notunterkunft erforderlich
                          </dt>
                          {report.displacement_start_date && (
                            <dd className="text-xs text-amber-600">
                              {new Intl.DateTimeFormat("de-DE", {
                                dateStyle: "medium",
                              }).format(new Date(report.displacement_start_date))}
                              {report.displacement_end_date
                                ? ` bis ${new Intl.DateTimeFormat("de-DE", {
                                    dateStyle: "medium",
                                  }).format(new Date(report.displacement_end_date))}`
                                : " (Ende offen)"}
                            </dd>
                          )}
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Sanierer-Info */}
                  {assignmentInfoMap[report.id] && (
                    <div className="border-t border-slate-100 p-4">
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                        Sanierungsbetrieb
                      </h2>
                      <p className="text-sm text-slate-700">
                        {assignmentInfoMap[report.id].sanierer_email ?? "Zugewiesen"}
                      </p>
                      {assignmentInfoMap[report.id].scheduled_start && (
                        <p className="text-xs text-slate-500">
                          Termin:{" "}
                          {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(
                            new Date(assignmentInfoMap[report.id].scheduled_start!)
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Trocknungs-Fortschritt */}
                  <div className="space-y-3 p-4">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Trocknungsfortschritt
                    </h2>

                    {entries.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        Noch keine Messwerte vorhanden.
                      </p>
                    ) : (
                      <>
                        {latestMoisture && (
                          <div className="rounded-lg bg-emerald-50 px-3 py-2">
                            <p className="text-xs text-emerald-600">Aktueller Messwert</p>
                            <p className="text-2xl font-bold text-emerald-700">
                              {latestMoisture.moisture_percent}%
                              <span className="ml-1 text-sm font-normal text-emerald-500">
                                Feuchtigkeit
                              </span>
                            </p>
                            {latestMoisture.room_label && (
                              <p className="text-xs text-emerald-600">
                                Raum: {latestMoisture.room_label}
                              </p>
                            )}
                            <p className="text-xs text-emerald-500">
                              {new Intl.DateTimeFormat("de-DE", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(new Date(latestMoisture.recorded_at))}
                            </p>
                          </div>
                        )}

                        <ul className="max-h-48 space-y-1 overflow-y-auto">
                          {entries.slice(1).map((e) => (
                            <li
                              key={e.id}
                              className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600"
                            >
                              <span>
                                {new Intl.DateTimeFormat("de-DE", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                }).format(new Date(e.recorded_at))}
                                {e.room_label ? ` · ${e.room_label}` : ""}
                              </span>
                              <span className="font-semibold">
                                {e.moisture_percent}%
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-slate-400">
                          {entries.length} Messung{entries.length === 1 ? "" : "en"} gesamt
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
        Diese Ansicht ist schreibgeschützt. Änderungen können nur vom Eigentümer oder dem beauftragten Sanierer vorgenommen werden.
      </div>
    </main>
  );
}
