import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClaimById } from "@/lib/db/damage-reports";
import { splitLabel, statusColor, statusLabel } from "@/lib/utils/claim-status";

type Params = {
  params: {
    id: string;
  };
};

export default async function ClaimDetailPage({ params }: Params) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: claim, error } = await getClaimById(supabase, params.id, user.id);

  if (error || !claim) {
    notFound();
  }

  const amount = (claim as any).estimated_amount ?? (claim as any).damage_amount_estimate ?? 0;
  const split = (claim as any).insurance_split ?? null;
  const status = (claim as any).status ?? "new";

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
          }).format(new Date((claim as any).created_at))}
        </p>
        <p className="text-lg font-semibold text-slate-900">
          {new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
          }).format(amount)}
        </p>
      </header>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Fotos</h2>
        <p className="text-xs text-slate-500">Placeholder: Hier werden später Schadenfotos angezeigt.</p>
      </section>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Trocknungsprotokoll</h2>
        <p className="text-xs text-slate-500">Placeholder: Hier erscheint das Trocknungsprotokoll.</p>
      </section>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Rechnungen</h2>
        <p className="text-xs text-slate-500">Placeholder: Hier werden Sanierer-Rechnungen gelistet.</p>
      </section>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Aktivitätsverlauf</h2>
        <p className="text-xs text-slate-500">Placeholder: Hier erscheint der Activity Feed.</p>
      </section>
    </main>
  );
}

