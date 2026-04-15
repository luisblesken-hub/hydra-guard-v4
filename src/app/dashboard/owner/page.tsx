import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClaimsWithProperty } from "@/lib/db/damage-reports";
import { ClaimsList } from "@/components/dashboard/claims-list";
import { MeldenPropertyLink } from "@/components/dashboard/melden-property-link";
import { ClaimsTimelineChart } from "@/components/dashboard/claims-timeline-chart";
import { statusLabel, statusColor } from "@/lib/utils/claim-status";

const FILTER_LABELS: Record<string, string> = {
  all: "Alle",
  open: "Offen",
  invoice_submitted: "Rechnung offen",
  closed: "Abgeschlossen",
  rejected: "Abgelehnt",
};

const OPEN_STATUSES = new Set([
  "submitted", "validating", "calculating", "reviewing",
  "approved", "dispatched", "in_remediation",
]);

export default async function OwnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; sort?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const filter = params.filter ?? "all";
  const sort = params.sort ?? "newest";

  const { data: allClaims, error } = await getClaimsWithProperty(supabase, user.id);

  let claims = (allClaims ?? []).filter((c) => {
    if (filter === "all") return true;
    if (filter === "open") return OPEN_STATUSES.has(c.status);
    return c.status === filter;
  });

  // Sortierung
  if (sort === "amount_desc") {
    claims = [...claims].sort((a, b) => (b.damage_amount_estimate ?? 0) - (a.damage_amount_estimate ?? 0));
  } else if (sort === "amount_asc") {
    claims = [...claims].sort((a, b) => (a.damage_amount_estimate ?? 0) - (b.damage_amount_estimate ?? 0));
  } else {
    // newest (default)
    claims = [...claims].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const total = allClaims?.length ?? 0;
  const openCount = (allClaims ?? []).filter((c) => OPEN_STATUSES.has(c.status)).length;
  const awaitingApproval = (allClaims ?? []).filter((c) => c.status === "invoice_submitted").length;
  const totalAmount = (allClaims ?? []).reduce((s, c) => s + (c.damage_amount_estimate ?? 0), 0);

  const admin = createAdminClient();
  const { data: properties } = await admin
    .from("properties")
    .select("id, label, street, city, postal_code, public_token")
    .eq("owner_id", user.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Meine Schadensfälle</h1>
          <p className="text-sm text-slate-500">
            {total === 0
              ? "Noch keine Schadenfälle erfasst."
              : `${total} Schadensfälle in deinem Bestand.`}
          </p>
        </div>
        <div className="flex gap-2">
          {total > 0 && (
            <a
              href="/api/owner/claims/summary"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              CSV Export
            </a>
          )}
          <Link
            href="/claims/new"
            className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Neuen Schaden melden
          </Link>
        </div>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {total > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Gesamtfälle", value: total, color: "text-slate-900" },
            { label: "In Bearbeitung", value: openCount, color: "text-amber-600" },
            { label: "Rechnung offen", value: awaitingApproval, color: "text-red-600" },
            {
              label: "Schadenssumme",
              value: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(totalAmount),
              color: "text-emerald-600",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter-Leiste */}
      {total > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(FILTER_LABELS).map(([key, label]) => (
            <Link
              key={key}
              href={key === "all" ? "/dashboard/owner" : `/dashboard/owner?filter=${key}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                filter === key
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
              {key === "open" && openCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 px-1 text-white">{openCount}</span>
              )}
              {key === "invoice_submitted" && awaitingApproval > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1 text-white">{awaitingApproval}</span>
              )}
            </Link>
          ))}
          {/* Sort-Buttons */}
          <div className="ml-auto flex gap-1">
            {[
              { key: "newest", label: "Neueste" },
              { key: "amount_desc", label: "Betrag ↓" },
              { key: "amount_asc", label: "Betrag ↑" },
            ].map((s) => (
              <Link
                key={s.key}
                href={`/dashboard/owner?filter=${filter}&sort=${s.key}`}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  sort === s.key
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(allClaims ?? []).length >= 3 && (
        <ClaimsTimelineChart
          claims={(allClaims ?? []).map((c) => ({
            created_at: c.created_at,
            damage_amount_estimate: c.damage_amount_estimate,
          }))}
        />
      )}

      {claims.length > 0 ? (
        <ClaimsList claims={claims} />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-600">
            {filter === "all" ? "Noch keine Schadensfälle vorhanden." : "Keine Fälle mit diesem Filter."}
          </p>
          {filter === "all" && (
            <Link href="/claims/new" className="mt-3 inline-flex rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-400">
              Ersten Schaden melden
            </Link>
          )}
        </div>
      )}

      {properties?.length ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Meine Objekte</h2>
            <Link href="/properties/new" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              + Objekt anlegen
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {properties.map((p) => (
              <MeldenPropertyLink
                key={p.id}
                id={p.id}
                publicToken={p.public_token as string}
                label={p.label}
                street={p.street}
                city={p.city}
                postalCode={p.postal_code}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
