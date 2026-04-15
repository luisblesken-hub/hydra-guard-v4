import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: me } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { count: total } = await admin
    .from("damage_reports")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id);

  const { count: open } = await admin
    .from("damage_reports")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .in("status", ["submitted", "dispatched", "in_remediation", "invoice_submitted"]);

  const { data: amounts } = await admin
    .from("damage_reports")
    .select("estimated_amount")
    .eq("owner_id", user.id);

  const totalAmount = (amounts ?? []).reduce((s, r) => s + (r.estimated_amount ?? 0), 0);

  return NextResponse.json({ total: total ?? 0, open: open ?? 0, total_amount_eur: totalAmount });
}
