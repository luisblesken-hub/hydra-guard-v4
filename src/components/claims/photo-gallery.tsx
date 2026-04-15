'use client';

import { useTransition, useState, useEffect } from "react";
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
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    if (!lightboxPhoto) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxPhoto(null);
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const i = photos.findIndex((p) => p.id === lightboxPhoto.id);
        if (i < 0) return;
        const next =
          e.key === "ArrowRight"
            ? photos[(i + 1) % photos.length]
            : photos[(i - 1 + photos.length) % photos.length];
        setLightboxPhoto(next);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxPhoto, photos]);

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
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo) => (
          <figure
            key={photo.id}
            className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
          >
            <button
              type="button"
              onClick={() => setLightboxPhoto(photo)}
              className="block aspect-video w-full overflow-hidden bg-slate-200"
            >
              <img
                src={photo.signed_url}
                alt={photo.original_name ?? "Schadenfoto"}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </button>
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

      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxPhoto(null);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Schließen"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxPhoto.signed_url}
            alt={lightboxPhoto.original_name ?? "Schadenfoto"}
            className="max-h-full max-w-full rounded-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1 text-xs text-white">
            {lightboxPhoto.original_name ?? "Schadenfoto"}
            {photos.length > 1 && (
              <span className="ml-2 text-white/70">
                {photos.findIndex((p) => p.id === lightboxPhoto.id) + 1} / {photos.length}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
