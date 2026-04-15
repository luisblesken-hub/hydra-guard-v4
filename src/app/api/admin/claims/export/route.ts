import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admin: Alle Schäden als CSV exportieren.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: me } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: claims } = await admin
    .from("damage_reports")
    .select(`
      id, status, category, estimated_amount, created_at, owner_id,
      confirmed_cause, reported_cause, habitability_status,
      properties:properties(label, street, city, postal_code)
    `)
    .order("created_at", { ascending: false });

  const CATEGORY_DE: Record<string, string> = {
    pipe_burst: "Rohrbruch",
    appliance_leak: "Geräteschaden",
    human_error: "Menschliches Versehen",
    roof_leak: "Dachleck",
    unknown: "Unbekannt",
  };

  const rows = [
    ["ID", "Status", "Kategorie", "Betrag (EUR)", "Adresse", "Ursache", "Bewohnbarkeit", "Owner-ID", "Datum"].join(";"),
    ...(claims ?? []).map((c) => {
      const prop = Array.isArray((c as any).properties)
        ? (c as any).properties[0]
        : (c as any).properties;
      const address = prop
        ? [prop.label, prop.street, prop.postal_code, prop.city].filter(Boolean).join(", ")
        : "—";
      return [
        c.id,
        c.status,
        CATEGORY_DE[c.category] ?? c.category,
        c.estimated_amount.toFixed(2).replace(".", ","),
        address.replace(/;/g, ","),
        (c.confirmed_cause ?? c.reported_cause ?? "").replace(/;/g, ","),
        c.habitability_status,
        c.owner_id,
        new Date(c.created_at).toISOString().slice(0, 10),
      ].join(";");
    }),
  ];

  return new NextResponse("\uFEFF" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="alle-schaeden-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
