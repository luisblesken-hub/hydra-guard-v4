import { createAdminClient } from "@/lib/supabase/admin";

const EVENT_LABEL: Record<string, string> = {
  claim_created: "Schaden gemeldet",
  claim_submitted: "Schaden eingereicht",
  status_changed: "Status geändert",
  invoice_submitted: "Rechnung eingereicht",
  invoice_approved: "Rechnung freigegeben",
  invoice_rejected: "Rechnung abgelehnt",
  invoice_paid: "Rechnung bezahlt",
  photo_uploaded: "Foto hochgeladen",
  drying_log_added: "Messwert erfasst",
  assignment_created: "Auftrag erstellt",
  note_added: "Notiz hinzugefügt",
};

const ROLE_LABEL: Record<string, string> = {
  owner: "Eigentümer",
  sanierer: "Sanierer",
  versicherung: "Versicherung",
  mieter: "Mieter",
  admin: "Admin",
};

const EVENT_ICON: Record<string, string> = {
  claim_created: "📋",
  claim_submitted: "📤",
  status_changed: "🔄",
  invoice_submitted: "🧾",
  invoice_approved: "✅",
  invoice_rejected: "❌",
  invoice_paid: "💶",
  photo_uploaded: "📷",
  drying_log_added: "💧",
  assignment_created: "🔧",
  note_added: "📝",
};

type ActivityEntry = {
  id: string;
  event_type: string;
  note: string | null;
  actor_role: string | null;
  created_at: string;
};

export async function ActivityFeed({ reportId }: { reportId: string }) {
  const admin = createAdminClient();

  const { data } = await admin
    .from("activity_feed")
    .select("id, event_type, note, actor_role, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: false })
    .limit(50);

  const entries: ActivityEntry[] = (data ?? []) as ActivityEntry[];

  if (entries.length === 0) {
    return (
      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Aktivitätsverlauf</h2>
        <p className="text-xs text-slate-400">Noch keine Aktivitäten für diesen Fall.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">
        Aktivitätsverlauf
        <span className="ml-2 text-xs font-normal text-slate-400">
          {entries.length} Einträge
        </span>
      </h2>

      <ol className="relative border-l border-slate-200 pl-4">
        {entries.map((entry) => {
          const icon = EVENT_ICON[entry.event_type] ?? "•";
          const label = EVENT_LABEL[entry.event_type] ?? entry.event_type;
          const role = entry.actor_role ? ROLE_LABEL[entry.actor_role] ?? entry.actor_role : null;

          return (
            <li key={entry.id} className="mb-4 last:mb-0">
              <div className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full border border-white bg-slate-300" />
              <div className="flex flex-wrap items-start justify-between gap-1">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    <span className="mr-1">{icon}</span>
                    {label}
                  </p>
                  {entry.note && (
                    <p className="text-xs text-slate-500">{entry.note}</p>
                  )}
                  {role && (
                    <p className="text-xs text-slate-400">{role}</p>
                  )}
                </div>
                <time className="shrink-0 text-xs text-slate-400">
                  {new Intl.DateTimeFormat("de-DE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(entry.created_at))}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
