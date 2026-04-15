import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopNav } from "@/components/layout/top-nav";

const NOTIFICATION_TYPES: Record<string, { label: string; description: string; roles: string[] }[]> = {
  owner: [
    { label: "Rechnung eingereicht", description: "Wenn ein Sanierer eine neue Rechnung einreicht", roles: ["owner"] },
    { label: "Sanierer nimmt Auftrag an", description: "Bei Statusänderung am Auftrag", roles: ["owner"] },
    { label: "Schaden abgeschlossen", description: "Wenn ein Fall auf 'Abgeschlossen' gesetzt wird", roles: ["owner"] },
  ],
  sanierer: [
    { label: "Neuer Auftrag", description: "Wenn du einem Schadensfall zugewiesen wirst", roles: ["sanierer"] },
    { label: "Rechnung freigegeben", description: "Wenn eine deiner Rechnungen freigegeben wird", roles: ["sanierer"] },
    { label: "Rechnung bezahlt", description: "Wenn eine Zahlung eingeht", roles: ["sanierer"] },
  ],
  versicherung: [
    { label: "Rechnung freigegeben", description: "Wenn eine Rechnung zur Zahlung bereit ist", roles: ["versicherung"] },
    { label: "Neuer relevanter Fall", description: "Wenn ein neuer Fall in Sanierung geht", roles: ["versicherung"] },
  ],
};

export default async function NotificationSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as string) ?? null;
  const email = profile?.email ?? user.email ?? "";
  const notifications = NOTIFICATION_TYPES[role ?? "owner"] ?? NOTIFICATION_TYPES["owner"];

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav role={role} email={email} userId={user.id} />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
        <Link href="/profile" className="-mb-2 text-sm text-slate-500 hover:text-slate-700">
          ← Zurück zum Profil
        </Link>
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Benachrichtigungen</h1>
          <p className="text-sm text-slate-500">
            E-Mail-Benachrichtigungen werden an <strong>{email}</strong> gesendet.
          </p>
        </header>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <strong>Hinweis:</strong> E-Mail-Benachrichtigungen sind noch nicht konfiguriert.
          Diese Einstellungen werden in einer zukünftigen Version aktiviert.
          Für Echtzeit-Updates nutze die Benachrichtigungs-Glocke im Dashboard.
        </div>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Verfügbare Benachrichtigungen</h2>
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <li key={n.label} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{n.label}</p>
                  <p className="text-xs text-slate-500">{n.description}</p>
                </div>
                <label className="flex cursor-not-allowed items-center gap-1 opacity-50" title="Noch nicht verfügbar">
                  <input type="checkbox" disabled className="rounded" />
                  <span className="text-xs text-slate-500">Aktivieren</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-slate-400 text-center">
          Für sofortige Benachrichtigungen beachte die Glocke 🔔 in der Navigation.
        </p>
      </main>
    </div>
  );
}
