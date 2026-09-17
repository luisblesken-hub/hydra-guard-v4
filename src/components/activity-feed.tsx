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
  tenant: "Mieter",
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
      <section className="space-y-2 rounded-lg border border-hg-line bg-white p-4">
        <h2 className="text-sm font-semibold text-hg-ink">Aktivitätsverlauf</h2>
        <p className="text-xs text-slate-500">Noch keine Aktivitäten für diesen Fall.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-lg border border-hg-line bg-white p-4">
      <h2 className="text-sm font-semibold text-hg-ink">
        Aktivitätsverlauf
        <span className="ml-2 text-xs font-normal text-slate-500">
          {entries.length} Einträge
        </span>
      </h2>

      <ol className="relative space-y-0 border-l border-hg-line pl-4">
        {entries.map((entry) => {
          const label = EVENT_LABEL[entry.event_type] ?? entry.event_type;
          const role = entry.actor_role
            ? ROLE_LABEL[entry.actor_role] ?? entry.actor_role
            : null;

          return (
            <li key={entry.id} className="relative mb-4 last:mb-0">
              <div className="absolute -left-[1.15rem] top-1.5 h-2 w-2 rounded-full border border-hg-line bg-white" />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  {entry.note && (
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      {entry.note}
                    </p>
                  )}
                  {role && (
                    <p className="mt-0.5 text-[11px] text-slate-400">{role}</p>
                  )}
                </div>
                <time className="shrink-0 text-[11px] tabular-nums text-slate-400">
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
