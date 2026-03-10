import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClaimsWithProperty } from "@/lib/db/damage-reports";
import { ClaimsList } from "@/components/dashboard/claims-list";

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
        <a
          href="/claims/new"
          className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
        >
          Neuen Schaden melden
        </a>
      </header>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {claims && <ClaimsList claims={claims} />}
    </main>
  );
}

