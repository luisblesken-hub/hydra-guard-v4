import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { statusColor, statusLabel } from "@/lib/utils/claim-status";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: property } = await admin
    .from("properties")
    .select("id, label, street, city, postal_code, building_type, owner_id, public_token, insurer_name, policy_number")
    .eq("id", id)
    .maybeSingle();

  if (!property || property.owner_id !== user.id) notFound();

  const { data: claims } = await admin
    .from("damage_reports")
    .select("id, status, category, estimated_amount, created_at, confirmed_cause, reported_cause")
    .eq("property_id", id)
    .order("created_at", { ascending: false });

  const CATEGORY_DE: Record<string, string> = {
    pipe_burst: "Rohrbruch",
    appliance_leak: "Geräteschaden",
    human_error: "Menschliches Versagen",
    roof_leak: "Dachleck",
    unknown: "Unbekannt",
  };

  const totalDamage = (claims ?? []).reduce((s, c) => s + (c.estimated_amount ?? 0), 0);
  const openCount = (claims ?? []).filter((c) =>
    ["submitted", "dispatched", "in_remediation", "invoice_submitted"].includes(c.status)
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <Link href="/dashboard/owner" className="-mb-2 inline-flex w-max text-sm text-slate-500 hover:text-slate-700">
        ← Zurück zum Dashboard
      </Link>

      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{property.label}</h1>
            <p className="text-sm text-slate-500">
              {[property.street, property.postal_code, property.city].filter(Boolean).join(", ")}
            </p>
            {property.building_type && (
              <p className="text-xs text-slate-400">{property.building_type}</p>
            )}
          </div>
          <Link
            href="/claims/new"
            className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400"
          >
            Schaden melden
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xl font-bold text-slate-900">{(claims ?? []).length}</p>
            <p className="text-xs text-slate-500">Schadensfälle gesamt</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xl font-bold text-amber-600">{openCount}</p>
            <p className="text-xs text-slate-500">Aktiv</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xl font-bold text-emerald-600">
              {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(totalDamage)}
            </p>
            <p className="text-xs text-slate-500">Schadensvolumen</p>
          </div>
        </div>

        {property.insurer_name && (
          <div className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <span className="text-slate-500">Versicherung: </span>
            <span className="font-medium text-slate-800">{property.insurer_name}</span>
            {property.policy_number && (
              <span className="text-slate-500"> · Pol.-Nr.: {property.policy_number}</span>
            )}
          </div>
        )}

        {property.public_token && (
          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-1">QR-Code / Melde-Link für Mieter:</p>
            <a
              href={`/melden/${property.public_token}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-indigo-600 hover:underline break-all"
            >
              /melden/{property.public_token}
            </a>
          </div>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Schadensfälle</h2>
        {(claims ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Noch keine Schadensfälle für dieses Objekt.
          </div>
        ) : (
          <ul className="space-y-3">
            {(claims ?? []).map((c) => (
              <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(c.status)}`}>
                        {statusLabel(c.status)}
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {CATEGORY_DE[c.category] ?? c.category}
                      </span>
                    </div>
                    {(c.confirmed_cause || c.reported_cause) && (
                      <p className="mt-1 text-xs text-slate-500 italic">
                        {c.confirmed_cause ?? c.reported_cause}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(c.created_at))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(c.estimated_amount)}
                    </p>
                    <Link
                      href={`/claims/${c.id}`}
                      className="mt-1 inline-flex items-center rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
