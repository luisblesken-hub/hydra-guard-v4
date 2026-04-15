import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Statistik-Endpunkt für Versicherungs-Dashboard:
 * Offene Rechnungen, Schadensvolumen, Durchschnittsabwicklung.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: me } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "versicherung") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [
    { count: totalClaims },
    { count: openClaims },
    { data: invoiceStats },
  ] = await Promise.all([
    admin.from("damage_reports")
      .select("*", { count: "exact", head: true })
      .in("status", ["in_remediation", "invoice_submitted", "invoice_approved", "closed"]),
    admin.from("damage_reports")
      .select("*", { count: "exact", head: true })
      .in("status", ["in_remediation", "invoice_submitted"]),
    admin.from("sanierer_invoices")
      .select("status, amount_gross, amount_net"),
  ]);

  const invoices = invoiceStats ?? [];
  const pending = invoices.filter((i) => i.status === "approved");
  const paid = invoices.filter((i) => i.status === "paid");

  const pendingAmount = pending.reduce((s, i) => s + (i.amount_gross ?? i.amount_net ?? 0), 0);
  const paidAmount = paid.reduce((s, i) => s + (i.amount_gross ?? i.amount_net ?? 0), 0);

  return NextResponse.json({
    total_claims: totalClaims ?? 0,
    open_claims: openClaims ?? 0,
    invoices: {
      total: invoices.length,
      pending_payment: pending.length,
      paid: paid.length,
      pending_amount_eur: pendingAmount,
      paid_amount_eur: paidAmount,
    },
  });
}
