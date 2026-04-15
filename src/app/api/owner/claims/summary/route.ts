import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * JSON-Zusammenfassung aller Schäden für einen Owner — für spätere Report-Nutzung.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: claims } = await admin
    .from("damage_reports")
    .select(`
      id, status, category, estimated_amount, created_at,
      confirmed_cause, reported_cause, habitability_status,
      properties:properties(label, street, city, postal_code)
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const CATEGORY_DE: Record<string, string> = {
    pipe_burst: "Rohrbruch",
    appliance_leak: "Geräteschaden",
    human_error: "Menschliches Versagen",
    roof_leak: "Dachleck",
    unknown: "Unbekannt",
  };

  const rows = [
    ["Schaden-ID", "Adresse", "Kategorie", "Status", "Betrag (EUR)", "Ursache", "Datum"].join(";"),
    ...(claims ?? []).map((c) => {
      const prop = Array.isArray((c as any).properties) ? (c as any).properties[0] : (c as any).properties;
      const address = prop ? [prop.street, prop.postal_code, prop.city].filter(Boolean).join(", ") : "—";
      return [
        c.id,
        address,
        CATEGORY_DE[c.category] ?? c.category,
        c.status,
        c.estimated_amount.toFixed(2).replace(".", ","),
        (c.confirmed_cause ?? c.reported_cause ?? "").replace(/;/g, ","),
        new Date(c.created_at).toISOString().slice(0, 10),
      ].join(";");
    }),
  ];

  return new NextResponse("\uFEFF" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="schaeden-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
