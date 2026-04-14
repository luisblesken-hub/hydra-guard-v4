import { notFound } from "next/navigation";
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

type Params = {
  params: Promise<{ id: string }>;
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

  const { data: claim, error } = await getClaimById(supabase, id, user.id);

  if (error || !claim) {
    notFound();
  }

  const amount = claim.estimated_amount ?? 0;
  const split = claim.insurance_split ?? null;
  const status = claim.status;

  const photosResult = await getPhotosByClaimId(supabase, id, user.id);

  // Fetch drying log entries via admin (RLS has no policies for this table)
  const admin = createAdminClient();

  // Fetch role for role-aware sections (Invoice Flow)
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profile?.role as string | null) ?? null;
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

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <header className="space-y-2">
        <p className="font-mono text-xs text-slate-400">
          Schaden-ID: {claim.id}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(
              status
            )}`}
          >
            {statusLabel(status)}
          </span>
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
          }).format(new Date(claim.created_at))}
        </p>
        <p className="text-lg font-semibold text-slate-900">
          {new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
          }).format(amount)}
        </p>

        <div className="flex flex-wrap gap-2">
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

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Fotos</h2>
        {photosResult.success ? (
          <PhotoGallery claimId={id} photos={photosResult.data} />
        ) : (
          <p className="text-xs text-red-500">{photosResult.error}</p>
        )}
        <PhotoUpload claimId={id} />
      </section>

      <DryingLogSection reportId={id} initialEntries={dryingEntries} />

      <InvoiceSection reportId={id} userId={user.id} role={role} />

      <ActivityFeed reportId={id} />
    </main>
  );
}

