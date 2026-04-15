import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Sanierer-Dashboard Statistiken (für künftige API-Clients / Mobile).
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: me } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "sanierer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [
    { count: totalAssignments },
    { count: openAssignments },
    { data: invoices },
  ] = await Promise.all([
    admin.from("assignments").select("*", { count: "exact", head: true }).eq("sanierer_id", user.id),
    admin.from("assignments").select("*", { count: "exact", head: true })
      .eq("sanierer_id", user.id)
      .in("status", ["pending", "accepted", "in_progress"]),
    admin.from("sanierer_invoices")
      .select("status, amount_gross, amount_net")
      .eq("sanierer_id", user.id),
  ]);

  const paid = (invoices ?? []).filter((i) => i.status === "paid");
  const pending = (invoices ?? []).filter((i) => ["submitted", "approved"].includes(i.status));

  return NextResponse.json({
    assignments: { total: totalAssignments ?? 0, open: openAssignments ?? 0 },
    revenue: {
      paid_eur: paid.reduce((s, i) => s + (i.amount_gross ?? i.amount_net ?? 0), 0),
      pending_eur: pending.reduce((s, i) => s + (i.amount_gross ?? i.amount_net ?? 0), 0),
    },
  });
}
