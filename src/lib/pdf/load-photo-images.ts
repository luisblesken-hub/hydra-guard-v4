import { createAdminClient } from "@/lib/supabase/admin";
import {
  isPhotoAnalysisResult,
  type PhotoAnalysisResult,
} from "@/lib/ai/photo-analysis-types";

export type PdfPhotoImage = {
  id: string;
  original_name: string | null;
  room_label: string | null;
  insurance_scope: string | null;
  uploaded_at: string;
  imageSrc: string | null;
  analysis: PhotoAnalysisResult | null;
};

type LoadOptions = {
  reportId: string;
  /** When set, only photos with this insurance_scope */
  insuranceScope?: string;
  /** Max photos to embed (keeps PDF size reasonable) */
  maxPhotos?: number;
};

/**
 * Downloads claim photos via admin storage and converts them to JPEG data URIs
 * suitable for @react-pdf/renderer Image.
 */
export async function loadPhotoImagesForPdf(
  options: LoadOptions
): Promise<PdfPhotoImage[]> {
  const { reportId, insuranceScope, maxPhotos = 8 } = options;
  const admin = createAdminClient();

  let query = admin
    .from("damage_photos")
    .select(
      "id, original_name, room_label, insurance_scope, uploaded_at, storage_path, mime_type, ai_analysis"
    )
    .eq("report_id", reportId)
    .order("uploaded_at", { ascending: true })
    .limit(maxPhotos);

  if (insuranceScope) {
    query = query.eq("insurance_scope", insuranceScope);
  }

  const { data: rows, error } = await query;
  if (error || !rows?.length) return [];

  const results: PdfPhotoImage[] = [];

  for (const row of rows) {
    let imageSrc: string | null = null;
    try {
      const { data: blob, error: dlError } = await admin.storage
        .from("damage-photos")
        .download(row.storage_path);

      if (!dlError && blob) {
        const buffer = Buffer.from(await blob.arrayBuffer());
        imageSrc = await bufferToJpegDataUri(buffer, row.mime_type);
      }
    } catch {
      imageSrc = null;
    }

    results.push({
      id: row.id,
      original_name: row.original_name,
      room_label: row.room_label,
      insurance_scope: row.insurance_scope,
      uploaded_at: row.uploaded_at,
      imageSrc,
      analysis: isPhotoAnalysisResult(row.ai_analysis) ? row.ai_analysis : null,
    });
  }

  return results;
}

async function bufferToJpegDataUri(
  buffer: Buffer,
  mimeType: string | null
): Promise<string | null> {
  const mime = (mimeType ?? "").toLowerCase();

  // Already PDF-safe formats — still normalize via sharp when available for size
  try {
    // sharp is a transitive dep of Next.js; avoid adding a direct package
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sharp = require("sharp") as typeof import("sharp");
    const jpeg = await sharp(buffer)
      .rotate()
      .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    // Fallback without sharp
    if (mime.includes("png")) {
      return `data:image/png;base64,${buffer.toString("base64")}`;
    }
    if (mime.includes("jpeg") || mime.includes("jpg")) {
      return `data:image/jpeg;base64,${buffer.toString("base64")}`;
    }
    return null;
  }
}
