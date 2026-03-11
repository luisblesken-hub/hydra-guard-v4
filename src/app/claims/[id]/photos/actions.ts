'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { uploadDamagePhoto, deleteDamagePhoto } from "@/lib/db/photos";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const UploadSchema = z.object({
  claimId: z.string().min(1),
});

export async function uploadPhotoAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const parsed = UploadSchema.safeParse({
    claimId: formData.get("claimId"),
  });

  if (!parsed.success) {
    return { success: false, error: "Ungültige Anfrage." };
  }

  const { claimId } = parsed.data;
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false, error: "Keine Datei übermittelt." };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: "Datei ist größer als 10 MB." };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Nur JPEG, PNG oder WebP sind erlaubt." };
  }

  // Sicherheitscheck: gehört der Claim dem aktuellen Nutzer?
  const { data: claim } = await supabase
    .from("damage_reports")
    .select("id")
    .eq("id", claimId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!claim) {
    return { success: false, error: "Schaden nicht gefunden oder keine Berechtigung." };
  }

  const result = await uploadDamagePhoto(supabase, file, claimId, user.id);

  if (!result.success) {
    return result;
  }

  revalidatePath(`/claims/${claimId}`);
  return { success: true };
}

const DeleteSchema = z.object({
  photoId: z.string().min(1),
  storagePath: z.string().min(1),
  claimId: z.string().min(1),
});

export async function deletePhotoAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const parsed = DeleteSchema.safeParse({
    photoId: formData.get("photoId"),
    storagePath: formData.get("storagePath"),
    claimId: formData.get("claimId"),
  });

  if (!parsed.success) {
    return { success: false, error: "Ungültige Anfrage." };
  }

  const { photoId, storagePath, claimId } = parsed.data;

  const result = await deleteDamagePhoto(supabase, photoId, storagePath, user.id);

  if (!result.success) {
    return result;
  }

  revalidatePath(`/claims/${claimId}`);
  return { success: true };
}

