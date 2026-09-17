import { createAdminClient } from "@/lib/supabase/admin";
import { stripGpsFromFile } from "@/lib/db/photos";

export async function POST(req: Request): Promise<Response> {
  const formData = await req.formData();
  const file = formData.get("file");
  const submissionUuid = formData.get("uuid");

  if (!(file instanceof File) || typeof submissionUuid !== "string" || !submissionUuid) {
    return new Response("Missing file or uuid", { status: 400 });
  }

  const cleaned = await stripGpsFromFile(file);
  const safeName = (file.name || "foto")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 180);
  const storagePath = `melden/${submissionUuid}/${safeName}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from("damage-photos")
    .upload(storagePath, cleaned, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[melden/upload] Storage upload failed", {
      storagePath,
      fileName: file.name,
      fileSize: file.size,
      errorMessage: error.message,
    });
    return Response.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return Response.json({
    storagePath,
    originalName: file.name,
    mimeType: file.type || null,
    fileSizeBytes: file.size,
  });
}
