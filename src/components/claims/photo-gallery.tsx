'use client';

import { useTransition } from "react";
import { deletePhotoAction } from "@/app/claims/[id]/photos/actions";

type Photo = {
  id: string;
  original_name: string | null;
  file_size_bytes: number | null;
  signed_url: string;
  uploaded_at: string;
  storage_path: string;
};

type Props = {
  claimId: string;
  photos: Photo[];
};

export function PhotoGallery({ claimId, photos }: Props) {
  const [isPending, startTransition] = useTransition();

  async function handleDelete(photo: Photo) {
    if (!confirm("Foto wirklich löschen?")) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("photoId", photo.id);
      formData.append("storagePath", photo.storage_path);
      formData.append("claimId", claimId);
      await deletePhotoAction(formData);
    });
  }

  if (!photos.length) {
    return <p className="text-xs text-slate-500">Noch keine Fotos hochgeladen.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo) => (
        <figure
          key={photo.id}
          className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
        >
          <div className="aspect-video overflow-hidden bg-slate-200">
            {/* use plain img to avoid remotePatterns config for now */}
            <img
              src={photo.signed_url}
              alt={photo.original_name ?? "Schadenfoto"}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <figcaption className="space-y-1 px-2 py-2">
            <p className="truncate text-xs font-medium text-slate-800">
              {photo.original_name ?? "Unbenanntes Foto"}
            </p>
            <p className="text-[11px] text-slate-500">
              {formatFileSize(photo.file_size_bytes ?? 0)} ·{" "}
              {new Intl.DateTimeFormat("de-DE", {
                dateStyle: "short",
              }).format(new Date(photo.uploaded_at))}
            </p>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDelete(photo)}
              className="mt-1 inline-flex rounded-md border border-slate-300 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Löschen
            </button>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

