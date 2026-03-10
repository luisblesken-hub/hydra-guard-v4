"use client";

import { revalidatePath } from "next/cache";
import { createDamageReport, getMyDamageReports } from "@/lib/db/damage-reports";

// Annahme (MVP): Owner wird über eine Env-Variable angenähert, bis Supabase-Auth eingebaut ist.
const OWNER_ID = process.env.NEXT_PUBLIC_HG_OWNER_ID ?? null;

async function createDamageReportAction(formData: FormData) {
  "use server";
  if (!OWNER_ID) {
    throw new Error("Owner-ID fehlt (NEXT_PUBLIC_HG_OWNER_ID).");
  }

  const estimatedAmount = Number(formData.get("estimated_amount") ?? 0);
  const category = (formData.get("category") as string) || "water";
  const claimTier = (formData.get("claim_tier") as string) || "small";
  const city = (formData.get("city") as string) || "";
  const postalCode = (formData.get("postal_code") as string) || "";

  await createDamageReport({
    ownerId: OWNER_ID,
    estimatedAmount,
    category: category as any,
    claimTier: claimTier as any,
    city,
    postalCode,
  });

  revalidatePath("/claims");
}

export default async function ClaimsPage() {
  const reports = OWNER_ID ? await getMyDamageReports(OWNER_ID) : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hydra Guard · Claims (MVP Owner-View)
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Minimaler Flow zum Anlegen und Anzeigen von Schäden. RLS greift auf
            der Datenbankebene gemäß Supabase-Policies.
          </p>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-medium">Schaden anlegen</h2>
          <p className="mt-1 text-xs text-slate-400">
            Annahme: Deine Owner-ID liegt in der Env-Variable{" "}
            <code>NEXT_PUBLIC_HG_OWNER_ID</code>.
          </p>
          <form action={createDamageReportAction} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300">
                Geschätzter Betrag (€)
              </label>
              <input
                name="estimated_amount"
                type="number"
                min={0}
                step="0.01"
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300">Kategorie</label>
              <select
                name="category"
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              >
                <option value="water">Water</option>
                <option value="fire">Fire</option>
                <option value="storm">Storm</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300">Tier</label>
              <select
                name="claim_tier"
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300">PLZ</label>
              <input
                name="postal_code"
                type="text"
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300">Stadt</label>
              <input
                name="city"
                type="text"
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-medium text-slate-950 hover:bg-emerald-400"
              >
                Schaden speichern
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-medium">Meine Schäden</h2>
          {!OWNER_ID && (
            <p className="mt-2 text-xs text-amber-400">
              Keine <code>NEXT_PUBLIC_HG_OWNER_ID</code>-Env-Variable gesetzt –
              Liste bleibt leer, bis Auth/Owner-Bindung angebunden ist.
            </p>
          )}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Betrag (€)</th>
                  <th className="py-2 pr-4">Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r: any) => (
                  <tr key={r.id} className="border-b border-slate-800 last:border-0">
                    <td className="py-2 pr-4 text-xs text-slate-400">{r.id}</td>
                    <td className="py-2 pr-4">
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {r.estimated_amount != null ? r.estimated_amount.toFixed(2) : "—"}
                    </td>
                    <td className="py-2 pr-4 text-xs text-slate-400">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleString("de-DE")
                        : "—"}
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td
                      className="py-4 text-sm text-slate-500"
                      colSpan={4}
                    >
                      Noch keine Schäden vorhanden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

