import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  SaniererReportDocument,
  type SaniererReportData,
} from "@/components/pdf/sanierer-report";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profile?.role as string | null) ?? null;

  const client = role === "sanierer" || role === "versicherung" || role === "admin"
    ? admin
    : supabase;

  let reportQuery = client
    .from("damage_reports")
    .select(`
      id,
      reported_cause,
      created_at,
      owner_id,
      properties:properties(
        street,
        city,
        postal_code
      )
    `)
    .eq("id", id);

  if (client === supabase) {
    reportQuery = reportQuery.eq("owner_id", user.id);
  }

  const reportResult = await reportQuery.maybeSingle();

  if (reportResult.error || !reportResult.data) {
    return new Response("Not found", { status: 404 });
  }

  const row = reportResult.data;
  const prop = Array.isArray((row as any).properties)
    ? (row as any).properties[0]
    : (row as any).properties;

  const photosResult = await client
    .from("damage_photos")
    .select("original_name, uploaded_at")
    .eq("report_id", id)
    .eq("insurance_scope", "building")
    .order("uploaded_at", { ascending: true });

  const photos = (photosResult.data ?? []) as Array<{
    original_name: string | null;
    uploaded_at: string;
  }>;

  const pdfData: SaniererReportData = {
    report: {
      id: row.id,
      reported_cause: row.reported_cause,
      created_at: row.created_at,
    },
    property: {
      address: prop?.street ?? "—",
      city: prop?.city ?? null,
      zip: prop?.postal_code ?? null,
    },
    photos,
  };

  const doc = (SaniererReportDocument as any)({ data: pdfData });
  const pdfBuffer = await renderToBuffer(doc as any);

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="schaden-${id}-sanierer.pdf"`,
    },
  });
}
