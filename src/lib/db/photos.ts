// GDPR: This module deals with damage photos which may contain personal data
// (faces, interiors). Never log raw URLs or file contents.
// Legal basis: Art. 6(1)(b) DSGVO. Retention: 8 years (GoBD).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export type UploadPhotoResult = { success: true } | { success: false; error: string };

export type DamagePhoto = {
  id: string;
  original_name: string | null;
  file_size_bytes: number | null;
  signed_url: string;
  uploaded_at: string;
  storage_path: string;
};

/**
 * Entfernt EXIF/GPS-Metadaten aus JPEG-Dateien (Datenschutz / DSGVO).
 * Findet APP0 (0xFFE0) und APP1 (0xFFE1) Marker und entfernt sie.
 * Für Nicht-JPEG-Dateien wird die Originaldatei zurückgegeben.
 */
async function stripGpsFromFile(file: File): Promise<File | Blob> {
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

    const { error: insertError } = await supabase.from("damage_photos").insert({
      report_id: claimId,
      uploaded_by: ownerId,
      storage_path: storagePath,
      original_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
    });

    if (insertError) {
      console.error("[uploadDamagePhoto] insert error:", insertError.code);
      // Attempt best-effort cleanup in storage.
      await supabase.storage.from("damage-photos").remove([storagePath]);
      return { success: false, error: "Fehler beim Speichern der Fotometadaten." };
    }

    return { success: true };
  } catch {
    console.error("[uploadDamagePhoto] unexpected error");
    return { success: false, error: "Unbekannter Fehler beim Foto-Upload." };
  }
}

export async function getPhotosByClaimId(
  supabase: Client,
  claimId: string,
  ownerId: string
): Promise<{ success: true; data: DamagePhoto[] } | { success: false; error: string }> {
  type DamagePhotoRow = {
    id: string;
    original_name: string | null;
    file_size_bytes: number | null;
    storage_path: string;
    uploaded_at: string;
  };

  const { data, error } = await supabase
    .from("damage_photos")
    .select("id, original_name, file_size_bytes, storage_path, uploaded_at")
    .eq("report_id", claimId)
    .eq("uploaded_by", ownerId)
    .order("uploaded_at", { ascending: true });

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
    });
  }

  return { success: true, data: enriched };
}

export async function deleteDamagePhoto(
  supabase: Client,
  photoId: string,
  storagePath: string,
  ownerId: string
): Promise<UploadPhotoResult> {
  try {
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

    return { success: true };
  } catch {
    console.error("[deleteDamagePhoto] unexpected error");
    return { success: false, error: "Unbekannter Fehler beim Löschen des Fotos." };
  }
}

