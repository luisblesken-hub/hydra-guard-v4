import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getClaimById } from "@/lib/db/damage-reports";
import { splitLabel, statusColor, statusLabel } from "@/lib/utils/claim-status";
import { getPhotosByClaimId } from "@/lib/db/photos";
import { PhotoGallery } from "@/components/claims/photo-gallery";
import { PhotoUpload } from "@/components/claims/photo-upload";
import { DryingLogSection, type DryingLogEntry } from "@/components/drying-log-section";
import { createAdminClient } from "@/lib/supabase/admin";
import { InvoiceSection } from "@/components/invoices/invoice-section";
import { ActivityFeed } from "@/components/activity-feed";
import { DispatcherSection } from "@/components/assignments/dispatcher-section";
import { InviteTenantSection } from "@/components/tenant/invite-section";
import { StatusStepper } from "@/components/claims/status-stepper";
import { ClaimNotes } from "@/components/claims/claim-notes";
import { OwnerClaimActions } from "@/components/claims/owner-claim-actions";
import { ShareClaimButton } from "@/components/claims/share-claim-button";

type Params = {
  params: Promise<{ id: string }>;
};

// Gemeinsamer Typ für claim-Objekt — deckt beide Quellpfade ab (Owner RLS + Admin-Bypass)
type ClaimView = {
  id: string;
  status: string;
  claim_tier: string;
  estimated_amount: number;
  category: string;
  habitability_status: string;
  has_contents_damage: boolean;
  liability_involved: boolean;
  displacement_required: boolean;
  complexity_flags: string[];
  created_at: string;
  description: string | null;
  escalation_reason: string | null;
  contents_insurer_name: string | null;
  contents_policy_number: string | null;
  liability_insurer_name: string | null;
  building_insurer_name: string | null;
  displacement_start_date: string | null;
  displacement_end_date: string | null;
  property_id: string;
  submitted_at: string | null;
  confirmed_cause: string | null;
  reported_cause: string | null;
  insurance_split: string | null;
};

export default async function ClaimDetailPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Owner: RLS-geschützte Abfrage. Sanierer/Insurer: Admin-Bypass.
  const adminClient = createAdminClient();
  const { data: profileEarly } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const userRole = (profileEarly?.role as string | null) ?? null;

  let claim = null;
  let claimError = null;

  if (userRole === "sanierer" || userRole === "versicherung" || userRole === "admin") {
    // Sanierer & Versicherung dürfen alle Schadensakten lesen
    const { data, error } = await adminClient
      .from("damage_reports")
      .select(`
        id, status, claim_tier, estimated_amount, category,
        habitability_status, has_contents_damage, liability_involved,
        displacement_required, complexity_flags, created_at,
        description, escalation_reason,
        contents_insurer_name, contents_policy_number,
        liability_insurer_name, building_insurer_name,
        displacement_start_date, displacement_end_date,
        property_id, submitted_at, confirmed_cause, reported_cause
      `)
      .eq("id", id)
      .maybeSingle();
    if (!data) claimError = "Schadenfall nicht gefunden.";
    else claim = { ...data, insurance_split: data.has_contents_damage ? "contents" : data.liability_involved ? "liability" : "building" };
  } else {
    const result = await getClaimById(supabase, id, user.id);
    claim = result.data;
    claimError = result.error;
  }

  if (claimError || !claim) {
    notFound();
  }

  // Einheitliche Typisierung — beide Code-Pfade auf ClaimView casten
  const typedClaim = claim as unknown as ClaimView;

  // owner_id für Dispatcher-Section
  const { data: ownerRow } = await adminClient
    .from("damage_reports")
    .select("owner_id")
    .eq("id", id)
    .maybeSingle();
  const ownerId = ownerRow?.owner_id ?? null;

  const amount = typedClaim.estimated_amount ?? 0;
  const split = typedClaim.insurance_split ?? null;
  const status = typedClaim.status;

  const photosResult = await getPhotosByClaimId(supabase, id, user.id);

  const role = userRole;
  const admin = adminClient;

  const { data: assignments } = await admin
    .from("assignments")
    .select("id")
    .eq("report_id", id);

  const assignmentIds = (assignments ?? []).map((a: { id: string }) => a.id);
  let dryingEntries: DryingLogEntry[] = [];
  if (assignmentIds.length > 0) {
    const { data } = await admin
      .from("drying_log_entries")
      .select("id, recorded_at, moisture_percent, room_label, equipment_notes")
      .in("assignment_id", assignmentIds)
      .order("recorded_at", { ascending: true });
    dryingEntries = (data ?? []) as DryingLogEntry[];
  }

  // Notizen aus Activity Feed
  const { data: notesData } = await admin
    .from("activity_feed")
    .select("id, note, actor_role, created_at")
    .eq("report_id", id)
    .eq("event_type", "note_added")
    .order("created_at", { ascending: true });
  const notes = (notesData ?? []) as { id: string; note: string | null; actor_role: string | null; created_at: string }[];

  // Adresse aus property laden für bessere Header-Darstellung
  const propertyId = (claim as { property_id?: string }).property_id ?? null;
  let address = "";
  if (propertyId) {
    const { data: propertyRow } = await admin
      .from("properties")
      .select("street, city, postal_code")
      .eq("id", propertyId)
      .maybeSingle();
    if (propertyRow) {
      address = [propertyRow.street, propertyRow.postal_code, propertyRow.city]
        .filter(Boolean)
        .join(", ");
    }
  }

  const backHref =
    role === "sanierer"
      ? "/dashboard/sanierer"
      : role === "versicherung"
        ? "/dashboard/insurance"
        : role === "admin"
          ? "/dashboard/admin"
          : "/dashboard/owner";

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <Link
        href={backHref}
        className="-mb-2 inline-flex w-max items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        ← Zurück zur Übersicht
      </Link>
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {address || "Schadensakte"}
            </h1>
            <p className="font-mono text-[10px] text-slate-400">
              ID: {typedClaim.id}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(
              status
            )}`}
          >
            {statusLabel(status)}
          </span>
        </div>
        <StatusStepper status={status} />
        <div className="flex flex-wrap items-center gap-2">
          {split && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {splitLabel(split)}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600">
          Erstellt am{" "}
          {new Intl.DateTimeFormat("de-DE", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(typedClaim.created_at))}
        </p>
        <p className="text-lg font-semibold text-slate-900">
          {new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
          }).format(amount)}
        </p>

        {/* Schadensursache */}
        {(typedClaim.confirmed_cause || typedClaim.reported_cause) && (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            {typedClaim.confirmed_cause ? (
              <p>
                <span className="font-semibold text-slate-700">Bestätigte Ursache: </span>
                <span className="text-slate-600">{typedClaim.confirmed_cause}</span>
              </p>
            ) : (
              <p>
                <span className="font-medium text-slate-500">Gemeldete Ursache: </span>
                <span className="italic text-slate-500">{typedClaim.reported_cause}</span>
              </p>
            )}
          </div>
        )}

        {role === "owner" && ownerId === user.id && (
          <OwnerClaimActions reportId={id} status={status} />
        )}

        <div className="flex flex-wrap gap-2">
          <ShareClaimButton claimId={id} />
          <a
            href={`/api/claims/${id}/export/insurer`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-max items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Versicherer-Export
          </a>
          <a
            href={`/api/claims/${id}/export/sanierer`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-max items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Sanierer-Export
          </a>
        </div>
      </header>

      {/* Schadensdetails */}
      <section className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Schadensdetails</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Kategorie</dt>
              <dd className="font-medium text-slate-800">
                {(({ pipe_burst: "Rohrbruch", appliance_leak: "Geräteschaden", human_error: "Menschliches Versagen", roof_leak: "Dachleck", unknown: "Unbekannt" } as Record<string, string>)[typedClaim.category as string]) ?? (typedClaim.category as string)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Bewohnbarkeit</dt>
              <dd className="font-medium text-slate-800">
                {(({ fully_habitable: "Vollständig bewohnbar", limited: "Eingeschränkt", uninhabitable: "Nicht bewohnbar" } as Record<string, string>)[typedClaim.habitability_status as string]) ?? (typedClaim.habitability_status as string)}
              </dd>
            </div>
            {typedClaim.description && (
              <div>
                <dt className="text-xs text-slate-500">Beschreibung</dt>
                <dd className="text-slate-600">{typedClaim.description}</dd>
              </div>
            )}
            {typedClaim.displacement_required && (
              <div className="rounded-md bg-amber-50 px-2 py-1.5">
                <dt className="text-xs font-semibold text-amber-700">Notunterkunft</dt>
                <dd className="text-xs text-amber-600">
                  {typedClaim.displacement_start_date
                    ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(typedClaim.displacement_start_date))
                    : "—"}
                  {typedClaim.displacement_end_date
                    ? ` – ${new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(typedClaim.displacement_end_date))}`
                    : " (offen)"}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Versicherungsinfos</h2>
          <dl className="space-y-2 text-sm">
            {typedClaim.building_insurer_name && (
              <div>
                <dt className="text-xs text-slate-500">Gebäudeversicherung</dt>
                <dd className="font-medium text-slate-800">{typedClaim.building_insurer_name}</dd>
              </div>
            )}
            {typedClaim.has_contents_damage && (
              <div>
                <dt className="text-xs text-slate-500">Hausratversicherung</dt>
                <dd className="font-medium text-slate-800">{typedClaim.contents_insurer_name ?? "—"}</dd>
                {typedClaim.contents_policy_number && (
                  <dd className="text-xs text-slate-500">Pol.-Nr.: {typedClaim.contents_policy_number}</dd>
                )}
              </div>
            )}
            {typedClaim.liability_involved && (
              <div>
                <dt className="text-xs text-slate-500">Haftpflichtversicherung</dt>
                <dd className="font-medium text-slate-800">{typedClaim.liability_insurer_name ?? "—"}</dd>
              </div>
            )}
            {!typedClaim.building_insurer_name && !typedClaim.has_contents_damage && !typedClaim.liability_involved && (
              <p className="text-xs text-slate-400">Keine Versicherungsinfos erfasst.</p>
            )}
          </dl>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Fotos</h2>
        {photosResult.success ? (
          <PhotoGallery claimId={id} photos={photosResult.data} />
        ) : (
          <p className="text-xs text-red-500">{photosResult.error}</p>
        )}
        <PhotoUpload claimId={id} />
      </section>

      <DispatcherSection reportId={id} role={role} ownerId={ownerId} userId={user.id} />

      <InviteTenantSection reportId={id} role={role} ownerId={ownerId} userId={user.id} />

      <DryingLogSection reportId={id} initialEntries={dryingEntries} />

      <InvoiceSection reportId={id} userId={user.id} role={role} />

      <ClaimNotes
        reportId={id}
        initialNotes={notes}
        canAdd={role === "owner" || role === "sanierer" || role === "versicherung" || role === "admin"}
      />

      <ActivityFeed reportId={id} />
    </main>
  );
}

