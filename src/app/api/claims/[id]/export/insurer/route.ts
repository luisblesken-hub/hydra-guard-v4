import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  VersichererReportDocument,
  type VersichererReportData,
} from "@/components/pdf/versicherer-report";
import { loadPhotoImagesForPdf } from "@/lib/pdf/load-photo-images";

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

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profile?.role as string | null) ?? null;

  const privileged =
    role === "sanierer" ||
    role === "versicherung" ||
    role === "insurer" ||
    role === "insurance" ||
    role === "admin";

  let reportQuery = (privileged ? admin : supabase)
    .from("damage_reports")
    .select(`
      id,
      status,
      estimated_amount,
      reported_cause,
      confirmed_cause,
      description,
      claim_tier,
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
    .eq("id", id);

  if (!privileged) {
    reportQuery = reportQuery.eq("owner_id", user.id);
  }

  const reportResult = await reportQuery.maybeSingle();

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

  const photos = await loadPhotoImagesForPdf({
    reportId: id,
    maxPhotos: 8,
  });

  const activityResult = await admin
    .from("activity_feed")
    .select("event_type, created_at")
    .eq("report_id", id)
    .order("created_at", { ascending: true });

  const activityFeed = (activityResult.data ?? []) as Array<{
    event_type: string;
    created_at: string;
  }>;

  const invoicesResult = await admin
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

  const pdfData: VersichererReportData = {
    report: {
      id: reportRow.id,
      status: reportRow.status,
      damage_amount_estimate: reportRow.estimated_amount,
      insurance_split,
      reported_cause: reportRow.reported_cause,
      confirmed_cause: reportRow.confirmed_cause,
      description: reportRow.description ?? null,
      claim_tier: reportRow.claim_tier ?? null,
      created_at: reportRow.created_at,
    },
    property: {
      address: propertyRow?.street ?? "—",
      city: propertyRow?.city ?? null,
      zip: propertyRow?.postal_code ?? null,
      building_type: propertyRow?.building_type ?? null,
    },
    photos,
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

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="gutachten-versicherer-${id}.pdf"`,
    },
  });
}
