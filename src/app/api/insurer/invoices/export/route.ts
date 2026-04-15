import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * CSV-Export aller Rechnungen für Versicherer.
 * Nur Role=versicherung.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "versicherung") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: invoices } = await admin
    .from("sanierer_invoices")
    .select(
      "id, report_id, invoice_number, amount_net, amount_gross, vat_rate, status, submitted_at, approved_at, paid_at",
    )
    .order("submitted_at", { ascending: false });

  // Reports für Addr
  const reportIds = [...new Set((invoices ?? []).map((i) => i.report_id))];
  const { data: reports } = await admin
    .from("damage_reports")
    .select("id, property_id, category, estimated_amount")
    .in("id", reportIds);

  const reportMap = Object.fromEntries((reports ?? []).map((r) => [r.id, r]));

  const propIds = (reports ?? []).map((r) => r.property_id).filter(Boolean);
  const { data: props } = await admin
    .from("properties")
    .select("id, street, city, postal_code")
    .in("id", propIds);
  const propMap = Object.fromEntries((props ?? []).map((p) => [p.id, p]));

  const rows = [
    [
      "Rechnungsnummer",
      "Status",
      "Netto (EUR)",
      "Brutto (EUR)",
      "MwSt %",
      "Eingereicht am",
      "Freigegeben am",
      "Bezahlt am",
      "Schadensbetrag (EUR)",
      "Kategorie",
      "Adresse",
      "Schaden-ID",
    ].join(";"),
  ];

  for (const inv of invoices ?? []) {
    const report = reportMap[inv.report_id];
    const prop = report ? propMap[report.property_id] : null;
    const address = prop
      ? [prop.street, prop.postal_code, prop.city].filter(Boolean).join(", ")
      : "";
    const d = (v: string | null) =>
      v ? new Date(v).toISOString().slice(0, 10) : "";
    rows.push(
      [
        inv.invoice_number ?? inv.id.slice(0, 8),
        inv.status,
        inv.amount_net.toFixed(2).replace(".", ","),
        (inv.amount_gross ?? inv.amount_net).toFixed(2).replace(".", ","),
        inv.vat_rate.toFixed(2).replace(".", ","),
        d(inv.submitted_at),
        d(inv.approved_at),
        d(inv.paid_at),
        (report?.estimated_amount ?? 0).toFixed(2).replace(".", ","),
        report?.category ?? "",
        address.replace(/;/g, ","),
        inv.report_id,
      ]
        .map((v) => String(v).replace(/"/g, '""'))
        .map((v) => (v.includes(";") ? `"${v}"` : v))
        .join(";"),
    );
  }

  const csv = "\uFEFF" + rows.join("\r\n"); // UTF-8 BOM für Excel

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rechnungen-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
