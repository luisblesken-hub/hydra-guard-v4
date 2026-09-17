import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserRedirect } from "@/lib/auth/get-user-redirect";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    redirect(getUserRedirect(profile?.role));
  }

  return (
    <div className="min-h-screen bg-hg-canvas">
      <header className="border-b border-hg-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-hg-ink text-[11px] font-bold tracking-wide text-white">
              HG
            </span>
            <span className="text-sm font-semibold tracking-tight text-hg-ink">
              HydraGuard
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hg-btn-ghost">
              Anmelden
            </Link>
            <Link href="/signup" className="hg-btn-primary">
              Registrieren
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-16 pb-24">
        <p className="hg-kicker">Wasserschaden-Management</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-hg-ink sm:text-4xl">
          Schadensfälle strukturiert abwickeln — von der Meldung bis zur Zahlung
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
          HydraGuard verbindet Eigentümer, Sanierer und Versicherer in einer
          gemeinsamen Akte. Dokumentation, Freigaben und Exporte bleiben
          nachvollziehbar und DSGVO-konform.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup" className="hg-btn-primary px-5 py-2.5">
            Konto anlegen
          </Link>
          <Link href="/login" className="hg-btn-secondary px-5 py-2.5">
            Zur Anmeldung
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-hg-line bg-hg-line sm:grid-cols-3">
          {[
            {
              title: "Eigentümer",
              desc: "Meldung, Beauftragung und Rechnungsfreigabe in einer Akte.",
            },
            {
              title: "Sanierer",
              desc: "Aufträge, Trocknungsprotokoll und digitale Abrechnung.",
            },
            {
              title: "Versicherer",
              desc: "Prüfung, Freigabe, Zahlung sowie PDF- und CSV-Export.",
            },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-white p-6">
              <h2 className="text-sm font-semibold text-hg-ink">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-hg-line pt-8 sm:grid-cols-4">
          {[
            { label: "Hosting", value: "EU / DSGVO" },
            { label: "Fotos", value: "Ohne GPS-Daten" },
            { label: "Export", value: "PDF & CSV" },
            { label: "Protokoll", value: "Trocknungskurve" },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-hg-muted">
                {label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-hg-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </main>

      <footer className="border-t border-hg-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 text-xs text-slate-500">
          <p>© 2026 HydraGuard · Aachen</p>
          <p>Dokumentenbasierte Schadenbearbeitung</p>
        </div>
      </footer>
    </div>
  );
}
