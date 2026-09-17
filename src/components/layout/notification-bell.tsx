import { createAdminClient } from "@/lib/supabase/admin";
import {
  NotificationBellClient,
  type BellEvent,
} from "@/components/layout/notification-bell-client";

/**
 * Zeigt eine Glocke mit Badge + Dropdown der letzten Events.
 * Owner: eigene Claims. Sanierer: zugewiesene Reports. Versicherung: alle Claims.
 * Mieter: eingeladene Reports.
 */
export async function NotificationBell({
  role,
  userId,
}: {
  role: string | null;
  userId: string;
}) {
  const admin = createAdminClient();

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

  const dashboardHref =
    role === "owner"
      ? "/dashboard/owner"
      : role === "sanierer"
        ? "/dashboard/sanierer"
        : role === "versicherung"
          ? "/dashboard/insurance"
          : role === "mieter"
            ? "/dashboard/mieter"
            : "/dashboard";

  const since = new Date();
  since.setDate(since.getDate() - 7);

  if (reportIds !== null && reportIds.length === 0) {
    return (
      <NotificationBellClient events={[]} unreadCount={0} dashboardHref={dashboardHref} />
    );
  }

  let listQuery = admin
    .from("activity_feed")
    .select("id, report_id, note, event_type, created_at")
    .gte("created_at", since.toISOString())
    .neq("actor_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (reportIds !== null) {
    listQuery = listQuery.in("report_id", reportIds);
  }

  const { data: rows } = await listQuery;
  const events = (rows ?? []) as BellEvent[];

  return (
    <NotificationBellClient
      events={events}
      unreadCount={events.length}
      dashboardHref={dashboardHref}
    />
  );
}
