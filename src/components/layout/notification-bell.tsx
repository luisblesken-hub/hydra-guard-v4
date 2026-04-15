import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Zeigt eine kleine Glocke mit Badge für aktuelle Events, die den Nutzer betreffen.
 * Owner: eigene Claims. Sanierer: zugewiesene Reports. Versicherung: alle Claims.
 */
export async function NotificationBell({
  role,
  userId,
}: {
  role: string | null;
  userId: string;
}) {
  const admin = createAdminClient();

  // Relevante Report-IDs je nach Rolle ermitteln
  let reportIds: string[] | null = null;
  if (role === "owner") {
    const { data } = await admin
      .from("damage_reports")
      .select("id")
      .eq("owner_id", userId);
    reportIds = (data ?? []).map((r) => r.id);
  } else if (role === "sanierer") {
    const { data } = await admin
      .from("assignments")
      .select("report_id")
      .eq("sanierer_id", userId);
    reportIds = (data ?? []).map((a) => a.report_id);
  } else if (role === "mieter") {
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.email) {
      const { data } = await admin
        .from("damage_invitations")
        .select("report_id")
        .eq("email", profile.email);
      reportIds = (data ?? []).map((i) => i.report_id);
    }
  }
  // versicherung + admin: alle Events sehen → reportIds bleibt null → keine Filterung

  const since = new Date();
  since.setDate(since.getDate() - 7); // Events der letzten 7 Tage

  let query = admin
    .from("activity_feed")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since.toISOString())
    .neq("actor_id", userId); // Eigene Aktionen nicht zählen

  if (reportIds !== null) {
    if (reportIds.length === 0) {
      return null;
    }
    query = query.in("report_id", reportIds);
  }

  const { count } = await query;
  const unreadCount = count ?? 0;

  return (
    <Link
      href={
        role === "owner"
          ? "/dashboard/owner"
          : role === "sanierer"
            ? "/dashboard/sanierer"
            : role === "versicherung"
              ? "/dashboard/insurance"
              : role === "mieter"
                ? "/dashboard/mieter"
                : "/dashboard"
      }
      className="relative rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      title={`${unreadCount} aktuelle Ereignisse`}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
