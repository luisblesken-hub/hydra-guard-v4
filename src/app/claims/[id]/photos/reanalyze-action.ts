"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  analyzeAndPersistPhoto,
  syncClaimEstimateFromPhotos,
} from "@/lib/ai/aggregate-claim-from-photos";
import { isVisionAnalysisConfigured } from "@/lib/ai/analyze-damage-photo";

/**
 * Re-run photo analysis for a claim (Owner/Admin).
 * Downloads stored images and prefers Vision when OPENAI_API_KEY is set.
 */
export async function reanalyzeClaimPhotosAction(claimId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Nicht authentifiziert." };

  const admin = createAdminClient();
  const { data: claim } = await admin
    .from("damage_reports")
    .select("id, owner_id, category, description, reported_cause")
    .eq("id", claimId)
    .maybeSingle();

  if (!claim) {
    return { success: false as const, error: "Schadenfall nicht gefunden." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profile?.role as string | null) ?? null;
  const isOwner = claim.owner_id === user.id;
  const isAdmin = role === "admin";
  if (!isOwner && !isAdmin) {
    return { success: false as const, error: "Keine Berechtigung." };
  }

  const { data: photos, error } = await admin
    .from("damage_photos")
    .select("id, storage_path, original_name, mime_type, file_size_bytes")
    .eq("report_id", claimId);

  if (error) {
    return { success: false as const, error: "Fotos konnten nicht geladen werden." };
  }

  if (!photos?.length) {
    return { success: false as const, error: "Keine Fotos vorhanden." };
  }

  let visionCount = 0;
  let heuristicCount = 0;

  for (const photo of photos) {
    let imageBytes: ArrayBuffer | null = null;
    try {
      const { data: blob } = await admin.storage
        .from("damage-photos")
        .download(photo.storage_path);
      if (blob) imageBytes = await blob.arrayBuffer();
    } catch {
      // non-blocking — heuristic still runs without bytes
    }

    const analysis = await analyzeAndPersistPhoto(admin, photo.id, {
      fileName: photo.original_name ?? photo.storage_path,
      mimeType: photo.mime_type,
      fileSizeBytes: photo.file_size_bytes,
      imageBytes,
      claimCategory: claim.category ?? null,
      claimDescription: [claim.description, claim.reported_cause]
        .filter(Boolean)
        .join(" "),
    });

    if (analysis.source === "vision") visionCount += 1;
    else heuristicCount += 1;
  }

  await syncClaimEstimateFromPhotos(admin, claimId, { force: false });

  await admin.from("activity_feed").insert({
    report_id: claimId,
    actor_id: user.id,
    actor_role: isOwner ? "owner" : "admin",
    event_type: "note_added",
    note: `Foto-Analyse erneut ausgeführt (${visionCount}× KI, ${heuristicCount}× System)${
      isVisionAnalysisConfigured() ? "" : " — kein OPENAI_API_KEY"
    }`,
  });

  revalidatePath(`/claims/${claimId}`);
  return {
    success: true as const,
    visionCount,
    heuristicCount,
    visionConfigured: isVisionAnalysisConfigured(),
  };
}
