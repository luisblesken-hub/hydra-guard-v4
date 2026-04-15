import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopNav } from "@/components/layout/top-nav";

const FAQ = [
  {
    q: "Wie melde ich einen Wasserschaden?",
    a: 'Klicke im Dashboard auf "Neuen Schaden melden" und folge dem Formular. Alternativ kann der Mieter über den QR-Code / Melde-Link ohne Login einen Schaden melden.',
  },
  {
    q: "Wie beauftrage ich einen Sanierer?",
    a: 'Öffne die Schadensakte und scrolle zu "Sanierer-Beauftragung". Wähle aus der Liste der verfügbaren Sanierer.',
  },
  {
    q: "Wie lade ich einen Mieter ein?",
    a: 'In der Schadensakte findest du die Sektion "Mieter-Zugang". Gib die E-Mail-Adresse ein — der Mieter erhält einen Link und kann sich mit einem Konto einloggen (schreibgeschützt).',
  },
  {
    q: "Wer darf Rechnungen freigeben?",
    a: "Nur der Eigentümer des Schadensfalls kann Rechnungen freigeben. Versicherer markieren freigegebene Rechnungen als bezahlt.",
  },
  {
    q: "Wie werden Foto-EXIF-Daten behandelt?",
    a: "Beim Upload werden EXIF- und GPS-Daten automatisch aus JPEG-Dateien entfernt (DSGVO-konform).",
  },
  {
    q: "Was passiert bei Schäden > 15.000 €?",
    a: "Schäden werden automatisch als 'Out of Scope' markiert und zur Prüfung an einen Gutachter übergeben.",
  },
  {
    q: "Wie exportiere ich Rechnungen für die Buchhaltung?",
    a: "Im Versicherer-Dashboard gibt es einen CSV-Export aller Rechnungen. Zusätzlich kann jede Schadensakte als PDF exportiert werden.",
  },
  {
    q: "Wo finde ich meine Rolle und Daten?",
    a: 'Klicke oben rechts auf deine E-Mail-Adresse, um zur Profil-Seite zu gelangen.',
  },
];

export default async function HelpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as string | null) ?? null;
  const email = profile?.email ?? user.email ?? "";

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav role={role} email={email} userId={user.id} />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Hilfe & FAQ</h1>
          <p className="text-sm text-slate-500">
            Antworten auf häufig gestellte Fragen zu HydraGuard.
          </p>
        </header>

        <section className="space-y-3">
          {FAQ.map((item, i) => (
            <details
              key={i}
              className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 hover:text-slate-700">
                <span className="mr-2 text-emerald-500">›</span>
                {item.q}
              </summary>
              <p className="mt-3 text-sm text-slate-600">{item.a}</p>
            </details>
          ))}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Weiterführende Hilfe</h2>
          <p className="mt-2 text-sm text-slate-600">
            Für weitere Fragen wende dich an{" "}
            <a href="mailto:support@hydraguard.de" className="font-medium text-emerald-600 hover:underline">
              support@hydraguard.de
            </a>
            {" "}oder per Telefon werktags 9–17 Uhr.
          </p>
        </section>

        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Zurück zum Dashboard
        </Link>
      </main>
    </div>
  );
}
