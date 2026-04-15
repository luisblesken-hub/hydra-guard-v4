import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

const EVENT_LABEL: Record<string, string> = {
  claim_created: "Schaden gemeldet",
  status_changed: "Status geändert",
  invoice_submitted: "Rechnung eingereicht",
  invoice_approved: "Rechnung freigegeben",
  invoice_paid: "Bezahlt",
  assignment_created: "Sanierer beauftragt",
  note_added: "Notiz",
  drying_log_added: "Messung",
};

const EVENT_COLOR: Record<string, string> = {
  invoice_paid: "text-green-600",
  invoice_approved: "text-emerald-600",
  invoice_submitted: "text-amber-600",
  claim_created: "text-blue-600",
};

type ActivityEntry = {
  id: string;
  event_type: string;
  note: string | null;
  created_at: string;
  report_id: string;
};

export async function RecentActivityWidget({ userId, role }: { userId: string; role: string | null }) {
  const admin = createAdminClient();

  let reportIds: string[] | null = null;
  if (role === "owner") {
    const { data } = await admin
      .from("damage_reports")
      .select("id")
      .eq("owner_id", userId)
      .limit(50);
    reportIds = (data ?? []).map((r) => r.id);
  } else if (role === "sanierer") {
    const { data } = await admin
      .from("assignments")
      .select("report_id")
      .eq("sanierer_id", userId);
    reportIds = (data ?? []).map((a) => a.report_id);
  }

  if (reportIds !== null && reportIds.length === 0) return null;

  let query = admin
    .from("activity_feed")
    .select("id, event_type, note, created_at, report_id")
    .neq("actor_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (reportIds !== null) {
    query = query.in("report_id", reportIds);
  }

  const { data } = await query;
  const entries: ActivityEntry[] = (data ?? []) as ActivityEntry[];

  if (entries.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Letzte Aktivitäten</h2>
      <ul className="mt-3 space-y-2">
        {entries.map((e) => (
          <li key={e.id} className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs font-medium ${EVENT_COLOR[e.event_type] ?? "text-slate-700"}`}>
                {EVENT_LABEL[e.event_type] ?? e.event_type}
              </p>
              {e.note && (
                <p className="text-[11px] text-slate-500 truncate max-w-xs">{e.note}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-slate-400">
                {new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(e.created_at))}
              </p>
              <Link href={`/claims/${e.report_id}`} className="text-[10px] text-indigo-600 hover:underline">
                Öffnen
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
