import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { VersichererReportDocument } from "@/components/pdf/versicherer-report";

// DSGVO: Art. 6 Abs. 1 lit. f – berechtigtes Interesse Vertragsanbahnung

export const runtime = "nodejs";

function deriveInsuranceSplit(
  hasContentsDamage: boolean,
  liabilityInvolved: boolean
): string {
  if (hasContentsDamage && liabilityInvolved) return "disputed";
  if (hasContentsDamage) return "contents";
  if (liabilityInvolved) return "liability";
  return "building";
}

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

  const reportResult = await supabase
    .from("damage_reports")
    .select(`
      id,
      status,
      estimated_amount,
      reported_cause,
      confirmed_cause,
      created_at,
      has_contents_damage,
      liability_involved,
      owner_id,
      properties:properties(
        street,
        city,
        postal_code,
        building_type
      )
    `)
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (reportResult.error || !reportResult.data) {
    return new Response("Not found", { status: 404 });
  }

  const reportRow = reportResult.data;
  const propertyRow = Array.isArray((reportRow as any).properties)
    ? (reportRow as any).properties[0]
    : (reportRow as any).properties;

  const insurance_split = deriveInsuranceSplit(
    reportRow.has_contents_damage,
    reportRow.liability_involved
  );

  const photosResult = await supabase
    .from("damage_photos")
    .select("original_name, room_label, insurance_scope, uploaded_at")
    .eq("report_id", id)
    .eq("uploaded_by", user.id)
    .order("uploaded_at", { ascending: true });

  const photos = (photosResult.data ?? []) as Array<{
    original_name: string | null;
    room_label: string | null;
    insurance_scope: string | null;
    uploaded_at: string;
  }>;

  const activityResult = await supabase
    .from("activity_feed")
    .select("event_type, created_at")
    .eq("report_id", id)
    .order("created_at", { ascending: true });

  const activityFeed = (activityResult.data ?? []) as Array<{
    event_type: string;
    created_at: string;
  }>;

  const invoicesResult = await supabase
    .from("sanierer_invoices")
    .select("amount_gross, amount_net, status, submitted_at")
    .eq("report_id", id)
    .order("submitted_at", { ascending: true });

  const invoices = (invoicesResult.data ?? []) as Array<{
    amount_gross: number | null;
    amount_net: number;
    status: string;
    submitted_at: string | null;
  }>;

  const pdfData = {
    report: {
      id: reportRow.id,
      status: reportRow.status,
      damage_amount_estimate: reportRow.estimated_amount,
      insurance_split,
      reported_cause: reportRow.reported_cause,
      confirmed_cause: reportRow.confirmed_cause,
      created_at: reportRow.created_at,
    },
    property: {
      address: propertyRow?.street ?? "—",
      city: propertyRow?.city ?? null,
      zip: propertyRow?.postal_code ?? null,
      building_type: propertyRow?.building_type ?? null,
    },
    photos: photos.map((p) => ({
      original_name: p.original_name,
      room_label: p.room_label,
      insurance_scope: p.insurance_scope,
      uploaded_at: p.uploaded_at,
    })),
    activityFeed: activityFeed.map((a) => ({
      action: a.event_type,
      created_at: a.created_at,
    })),
    invoices: invoices.map((inv) => ({
      amount: inv.amount_gross ?? inv.amount_net ?? 0,
      status: inv.status,
      created_at: inv.submitted_at ?? reportRow.created_at,
    })),
  };

  const documentEl = (VersichererReportDocument as any)({ data: pdfData });
  const pdfBuffer = await renderToBuffer(documentEl as any);

  const pdfBytes = new Uint8Array(pdfBuffer);

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="schaden-${id}-versicherer.pdf"`,
    },
  });
}

