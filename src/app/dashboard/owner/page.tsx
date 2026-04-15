import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getClaimsWithProperty } from "@/lib/db/damage-reports";
import { ClaimsList } from "@/components/dashboard/claims-list";
import { MeldenPropertyLink } from "@/components/dashboard/melden-property-link";

export default async function OwnerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: claims, error } = await getClaimsWithProperty(supabase, user.id);

  const total = claims?.length ?? 0;

  // Stats
  const openStatuses = new Set([
    "submitted",
    "validating",
    "calculating",
    "reviewing",
    "approved",
    "dispatched",
    "in_remediation",
    "invoice_submitted",
  ]);
  const openCount = (claims ?? []).filter((c) => openStatuses.has(c.status)).length;
  const awaitingApproval = (claims ?? []).filter((c) => c.status === "invoice_submitted").length;
  const totalAmount = (claims ?? []).reduce(
    (sum, c) => sum + (c.damage_amount_estimate ?? 0),
    0,
  );

  const {
    data: properties,
    error: propertiesError,
  } = await supabase
    .from("properties")
    .select("id, label, street, city, postal_code, public_token")
    .eq("owner_id", user.id);

  void propertiesError;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Meine Schadensfälle
          </h1>
          <p className="text-sm text-slate-500">
            {total === 0
              ? "Noch keine Schadenfälle in Hydra Guard erfasst."
              : `${total} Schadensfälle in deinem Bestand.`}
          </p>
        </div>
        <Link
          href="/claims/new"
          className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
        >
          Neuen Schaden melden
        </Link>
      </header>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {total > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-3xl font-bold text-slate-900">{total}</p>
            <p className="text-xs text-slate-500">Gesamtfälle</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-3xl font-bold text-amber-600">{openCount}</p>
            <p className="text-xs text-slate-500">In Bearbeitung</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-3xl font-bold text-red-600">{awaitingApproval}</p>
            <p className="text-xs text-slate-500">Rechnung offen</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-3xl font-bold text-emerald-600">
              {new Intl.NumberFormat("de-DE", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              }).format(totalAmount)}
            </p>
            <p className="text-xs text-slate-500">Schadenssumme gesamt</p>
          </div>
        </div>
      )}

      {claims && <ClaimsList claims={claims} />}

      {properties?.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Meine Objekte</h2>
          <div className="grid grid-cols-1 gap-4">
            {properties.map((p) => (
              <MeldenPropertyLink
                key={p.id}
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

