import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: me } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const checks: Record<string, string | number> = {};
  const t0 = Date.now();

  const { count: reports } = await admin.from("damage_reports").select("*", { count: "exact", head: true });
  checks.damage_reports = reports ?? 0;

  const { count: profiles } = await admin.from("profiles").select("*", { count: "exact", head: true });
  checks.profiles = profiles ?? 0;

  const { count: invoices } = await admin.from("sanierer_invoices").select("*", { count: "exact", head: true });
  checks.sanierer_invoices = invoices ?? 0;

  const { count: assignments } = await admin.from("assignments").select("*", { count: "exact", head: true });
  checks.assignments = assignments ?? 0;

  const { count: activities } = await admin.from("activity_feed").select("*", { count: "exact", head: true });
  checks.activity_feed = activities ?? 0;

  const { count: props } = await admin.from("properties").select("*", { count: "exact", head: true });
  checks.properties = props ?? 0;

  checks.latency_ms = Date.now() - t0;
  checks.status = "ok";
  checks.timestamp = new Date().toISOString();

  return NextResponse.json(checks);
}
