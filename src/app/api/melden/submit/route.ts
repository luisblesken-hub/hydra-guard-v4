import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

// DSGVO: Art. 6 Abs. 1 lit. f – berechtigtes Interesse Vertragsanbahnung

const SubmitSchema = z.object({
  propertyToken: z.string().min(1),
  unitLabel: z.string().min(1).max(200),
  reporterName: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  photoStoragePaths: z.array(z.string().min(1)).min(1),
});

function deriveOriginalName(storagePath: string) {
  const parts = storagePath.split("/");
  return parts[parts.length - 1] ?? storagePath;
}

// Einfaches In-Memory Rate-Limit (pro IP max 5 Submissions pro Stunde)
// Für Produktion: Redis / Upstash empfohlen
const submissions = new Map<string, number[]>();
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 Stunde

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const times = (submissions.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= RATE_LIMIT) return true;
  submissions.set(ip, [...times, now]);
  return false;
}

export async function POST(
  req: Request
): Promise<Response> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return Response.json({ error: "Zu viele Anfragen. Bitte warte eine Stunde." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = SubmitSchema.safeParse(body);

  if (!parsed.success) {
    return new Response("Invalid request", { status: 400 });
  }

  const { propertyToken, unitLabel, reporterName, description, photoStoragePaths } =
    parsed.data;

  const admin = createAdminClient();

  const {
    data: property,
    error: propertyError,
  } = await admin
    .from("properties")
    .select("id, owner_id")
    .eq("public_token", propertyToken)
    .maybeSingle();

  if (propertyError || !property) {
    return new Response("Property not found", { status: 404 });
  }

  const {
    data: reportRow,
    error: reportError,
  } = await admin
    .from("damage_reports")
    .insert({
      property_id: property.id,
      owner_id: property.owner_id,
      status: "submitted",
      estimated_amount: 0,
      reported_cause: description,
      description,
    })
    .select("id")
    .single();

  if (reportError || !reportRow?.id) {
    return new Response("Failed to create report", { status: 500 });
  }

  const reportId = reportRow.id;

  // NOTE: `damage_photos.uploaded_by` is NOT NULL in the current schema,
  // so we use the property owner UUID as a safe admin-side placeholder.
  const photoRows = photoStoragePaths.map((storagePath) => ({
    report_id: reportId,
    uploaded_by: property.owner_id,
    storage_path: storagePath,
    original_name: deriveOriginalName(storagePath),
    mime_type: null,
    file_size_bytes: null,
    insurance_scope: "building",
  }));

  const { error: photosError } = await admin
    .from("damage_photos")
    .insert(photoRows as any);

  if (photosError) {
    return new Response("Failed to upload photos", { status: 500 });
  }

  const activityText = `Schaden gemeldet von ${reporterName}, Einheit ${unitLabel}`;

  const { error: activityError } = await admin.from("activity_feed").insert({
    report_id: reportId,
    actor_id: null,
    event_type: activityText,
  } as any);

  if (activityError) {
    return new Response("Failed to record activity", { status: 500 });
  }

  return Response.json({ reportId });
}

