import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { statusLabel } from "@/lib/utils/claim-status";

/**
 * CSV export of all owner claims (semicolon-separated, DE locale).
 * Previously this route returned JSON summary — the dashboard button said "CSV Export".
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
  const { data: me } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: claims } = await admin
    .from("damage_reports")
    .select(
      "id, status, estimated_amount, claim_tier, category, reported_cause, created_at, property_id"
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const propIds = [
    ...new Set((claims ?? []).map((c) => c.property_id).filter(Boolean)),
  ];
  const { data: props } =
    propIds.length > 0
      ? await admin
          .from("properties")
          .select("id, street, city, postal_code")
          .in("id", propIds)
      : { data: [] as Array<{ id: string; street: string; city: string | null; postal_code: string | null }> };

  const propMap = Object.fromEntries((props ?? []).map((p) => [p.id, p]));

  const tierDe = (t: string | null) => {
    if (t === "auto_track") return "Standard";
    if (t === "out_of_scope") return "Gutachter";
    if (t === "expert_track") return "Experte (Legacy)";
    return t ?? "";
  };

  const rows = [
    [
      "Schaden-ID",
      "Status",
      "Track",
      "Kategorie",
      "Schätzwert (EUR)",
      "Ursache",
      "Adresse",
      "PLZ",
      "Ort",
      "Angelegt am",
    ].join(";"),
  ];

  for (const c of claims ?? []) {
    const prop = propMap[c.property_id];
    const amount = Number(c.estimated_amount ?? 0)
      .toFixed(2)
      .replace(".", ",");
    const created = c.created_at
      ? new Date(c.created_at).toISOString().slice(0, 10)
      : "";
    rows.push(
      [
        c.id,
        statusLabel(c.status),
        tierDe(c.claim_tier),
        c.category ?? "",
        amount,
        (c.reported_cause ?? "").replace(/;/g, ","),
        (prop?.street ?? "").replace(/;/g, ","),
        prop?.postal_code ?? "",
        (prop?.city ?? "").replace(/;/g, ","),
        created,
      ].join(";")
    );
  }

  const csv = "\uFEFF" + rows.join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hydra-claims-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
