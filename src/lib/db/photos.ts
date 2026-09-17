// GDPR: This module deals with damage photos which may contain personal data
// (faces, interiors). Never log raw URLs or file contents.
// Legal basis: Art. 6(1)(b) DSGVO. Retention: 8 years (GoBD).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { analyzeAndPersistPhoto, syncClaimEstimateFromPhotos } from "@/lib/ai/aggregate-claim-from-photos";
import { isPhotoAnalysisResult, type PhotoAnalysisResult } from "@/lib/ai/photo-analysis-types";

type Client = SupabaseClient<Database>;

export type UploadPhotoResult =
  | { success: true; photoId: string; analysis: PhotoAnalysisResult | null }
  | { success: false; error: string };

export type DamagePhoto = {
  id: string;
  original_name: string | null;
  file_size_bytes: number | null;
  signed_url: string;
  uploaded_at: string;
  storage_path: string;
  ai_analysis: PhotoAnalysisResult | null;
};

/**
 * Entfernt EXIF/GPS-Metadaten aus JPEG-Dateien (Datenschutz / DSGVO).
 * Findet APP0 (0xFFE0) und APP1 (0xFFE1) Marker und entfernt sie.
 * Für Nicht-JPEG-Dateien wird die Originaldatei zurückgegeben.
 */
export async function stripGpsFromFile(file: File): Promise<File | Blob> {
  // Nur JPEG verarbeiten
  if (!file.type.includes("jpeg") && !file.type.includes("jpg")) return file;

  try {
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);

    // JPEG-Header prüfen: 0xFF 0xD8
    if (data[0] !== 0xff || data[1] !== 0xd8) return file;

    const result: number[] = [0xff, 0xd8]; // SOI Marker behalten
    let i = 2;

    while (i < data.length - 1) {
      // Marker suchen
      if (data[i] !== 0xff) {
        result.push(data[i]);
        i++;
        continue;
      }

      const marker = data[i + 1];

      // APP0 (0xE0) und APP1 (0xE1) überspringen — enthalten EXIF/GPS/JFIF
      if (marker === 0xe0 || marker === 0xe1) {
        if (i + 3 < data.length) {
          // Länge des Segments (inkl. Längen-Bytes, exkl. Marker)
          const segLen = (data[i + 2] << 8) | data[i + 3];
          i += 2 + segLen; // Marker (2 Bytes) + Segment überspringen
        } else {
          i++;
        }
        continue;
      }

      // EOI (0xD9) — Ende
      if (marker === 0xd9) {
        result.push(0xff, 0xd9);
        break;
      }

      // Alle anderen Marker behalten
      result.push(data[i]);
      i++;
    }

    return new Blob([new Uint8Array(result)], { type: file.type });
  } catch {
    // Bei Fehler Original zurückgeben — nie den Upload blockieren
    return file;
  }
}

export async function uploadDamagePhoto(
  supabase: Client,
  file: File,
  claimId: string,
  ownerId: string
): Promise<UploadPhotoResult> {
  try {
    const cleaned = await stripGpsFromFile(file);
    const imageBytes = await cleaned.arrayBuffer();
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `claims/${claimId}/${timestamp}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("damage-photos")
      .upload(storagePath, cleaned, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[uploadDamagePhoto] storage error:", uploadError.name);
      return { success: false, error: "Fehler beim Hochladen der Datei." };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("damage_photos")
      .insert({
        report_id: claimId,
        uploaded_by: ownerId,
        storage_path: storagePath,
        original_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("[uploadDamagePhoto] insert error:", insertError?.code);
      await supabase.storage.from("damage-photos").remove([storagePath]);
      return { success: false, error: "Fehler beim Speichern der Fotometadaten." };
    }

    // Claim context for analysis (best-effort)
    const { data: claim } = await supabase
      .from("damage_reports")
      .select("category, description, reported_cause")
      .eq("id", claimId)
      .maybeSingle();

    let analysis: PhotoAnalysisResult | null = null;
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const admin = createAdminClient();
      analysis = await analyzeAndPersistPhoto(admin, inserted.id, {
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        imageBytes,
        claimCategory: claim?.category ?? null,
        claimDescription: [claim?.description, claim?.reported_cause].filter(Boolean).join(" "),
      });
      await syncClaimEstimateFromPhotos(admin, claimId);
    } catch {
      console.error("[uploadDamagePhoto] analysis failed (non-blocking)");
    }

    return { success: true, photoId: inserted.id, analysis };
  } catch {
    console.error("[uploadDamagePhoto] unexpected error");
    return { success: false, error: "Unbekannter Fehler beim Foto-Upload." };
  }
}

export async function getPhotosByClaimId(
  supabase: Client,
  claimId: string,
  ownerId?: string
): Promise<{ success: true; data: DamagePhoto[] } | { success: false; error: string }> {
  type DamagePhotoRow = {
    id: string;
    original_name: string | null;
    file_size_bytes: number | null;
    storage_path: string;
    uploaded_at: string;
    ai_analysis: PhotoAnalysisResult | null;
  };

  let query = supabase
    .from("damage_photos")
    .select("id, original_name, file_size_bytes, storage_path, uploaded_at, ai_analysis")
    .eq("report_id", claimId)
    .order("uploaded_at", { ascending: true });

  if (ownerId) {
    query = query.eq("uploaded_by", ownerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getPhotosByClaimId] select error:", error.code);
    return { success: false, error: "Fehler beim Laden der Fotos." };
  }

  const rows = (data ?? []) as DamagePhotoRow[];
  const enriched: DamagePhoto[] = [];

  for (const row of rows) {
    const storagePath = row.storage_path;
    const { data: signed, error: signedError } = await supabase.storage
      .from("damage-photos")
      .createSignedUrl(storagePath, 3600);

    if (signedError || !signed?.signedUrl) {
      console.error("[getPhotosByClaimId] signed url error:", signedError?.name);
      continue;
    }

    enriched.push({
      id: row.id,
      original_name: row.original_name ?? null,
      file_size_bytes: row.file_size_bytes ?? null,
      signed_url: signed.signedUrl,
      uploaded_at: row.uploaded_at,
      storage_path: storagePath,
      ai_analysis: isPhotoAnalysisResult(row.ai_analysis) ? row.ai_analysis : null,
    });
  }

  return { success: true, data: enriched };
}

export async function deleteDamagePhoto(
  supabase: Client,
  photoId: string,
  storagePath: string,
  ownerId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { data: photo } = await supabase
      .from("damage_photos")
      .select("report_id")
      .eq("id", photoId)
      .maybeSingle();

    const { error: deleteDbError } = await supabase
      .from("damage_photos")
      .delete()
      .eq("id", photoId)
      .eq("uploaded_by", ownerId);

    if (deleteDbError) {
      console.error("[deleteDamagePhoto] db error:", deleteDbError.code);
      return { success: false, error: "Fehler beim Löschen des Fotos." };
    }

    const { error: storageError } = await supabase.storage
      .from("damage-photos")
      .remove([storagePath]);

    if (storageError) {
      console.error("[deleteDamagePhoto] storage error:", storageError.name);
      return {
        success: false,
        error: "Foto wurde aus der Datenbank entfernt, aber die Datei konnte nicht gelöscht werden.",
      };
    }

    if (photo?.report_id) {
      await syncClaimEstimateFromPhotos(supabase, photo.report_id);
    }

    return { success: true };
  } catch {
    console.error("[deleteDamagePhoto] unexpected error");
    return { success: false, error: "Unbekannter Fehler beim Löschen des Fotos." };
  }
}
