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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 text-lg font-bold text-emerald-600">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3C8 8 4 10.5 4 14a8 8 0 0016 0c0-3.5-4-6-8-11z"
            />
          </svg>
          HydraGuard
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-md px-4 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            Anmelden
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Registrieren
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-5xl px-6 pt-10 pb-20">
        <div className="text-center">
          <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            Wasserschaden-Management für Deutschland
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Wasserschäden professionell abwickeln
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Vom ersten Schadenfoto bis zur Zahlung durch die Versicherung — HydraGuard führt Eigentümer, Sanierer und Versicherer durch einen durchgängigen, DSGVO-konformen Workflow.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
            >
              Kostenlos registrieren
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Zur Anmeldung
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              title: "Eigentümer",
              desc: "Schaden melden, Sanierer beauftragen, Rechnungen freigeben — alles in einer Akte.",
              icon: "🏠",
            },
            {
              title: "Sanierer",
              desc: "Aufträge annehmen, Trocknungsverlauf dokumentieren, digital abrechnen.",
              icon: "🔧",
            },
            {
              title: "Versicherer",
              desc: "Schäden prüfen, freigegebene Rechnungen bezahlen, PDF- und CSV-Export.",
              icon: "🛡️",
            },
          ].map(({ title, desc, icon }) => (
            <div
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 text-3xl">{icon}</div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </div>

        {/* Features Row */}
        <div className="mt-16 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6 sm:grid-cols-4">
          {[
            { label: "DSGVO-konform", value: "EU-Hosting" },
            { label: "Foto-Upload", value: "Ohne GPS-Daten" },
            { label: "PDF-Export", value: "Versicherer-ready" },
            { label: "Trocknungs-Chart", value: "Auto-generiert" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-sm font-semibold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-xs text-slate-500">
          <p>© 2026 HydraGuard · Aachen</p>
          <p>Wasserschaden-Management-SaaS</p>
        </div>
      </footer>
    </div>
  );
}
