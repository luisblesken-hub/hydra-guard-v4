'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadPhotoAction } from "@/app/claims/[id]/photos/actions";

type FileEntry = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

type Props = {
  claimId: string;
};

export function PhotoUpload({ claimId }: Props) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const limited = selected.slice(0, 10);

    const entries: FileEntry[] = limited.map((file) => {
      if (file.size > 10 * 1024 * 1024) {
        return {
          file,
          status: "error",
          error: "Datei ist größer als 10 MB.",
        };
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        return {
          file,
          status: "error",
          error: "Nur JPEG, PNG oder WebP sind erlaubt.",
        };
      }
      return { file, status: "pending" };
    });

    setFiles(entries);
  }

  async function handleUpload() {
    startTransition(async () => {
      const updated: FileEntry[] = [];
      for (const entry of files) {
        if (entry.status === "error") {
          updated.push(entry);
          continue;
        }

        updated.push({ ...entry, status: "uploading", error: undefined });
        setFiles([...updated, ...files.slice(updated.length)]);

        const formData = new FormData();
        formData.append("claimId", claimId);
        formData.append("file", entry.file);

        const result = await uploadPhotoAction(formData);

        if (!result.success) {
          updated[updated.length - 1] = {
            ...entry,
            status: "error",
            error: result.error ?? "Upload fehlgeschlagen.",
          };
        } else {
          updated[updated.length - 1] = {
            ...entry,
            status: "done",
          };
        }
        setFiles([...updated, ...files.slice(updated.length)]);
      }

      router.refresh();
    });
  }

  const hasUploadable = files.some((f) => f.status === "pending" || f.status === "error");

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Fotos hinzufügen
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={onFileChange}
          className="mt-1 block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-50 hover:file:bg-slate-800"
        />
        <p className="mt-1 text-[11px] text-slate-400">
          Maximal 10 Dateien, je bis 10 MB. Erlaubte Formate: JPEG, PNG, WebP.
        </p>
      </div>

      {files.length > 0 && (
        <ul className="space-y-1 text-xs">
          {files.map((entry, idx) => (
            <li key={`${entry.file.name}-${idx}`} className="flex items-center justify-between">
              <span className="truncate text-slate-700">{entry.file.name}</span>
              <span className="ml-2 text-[11px] text-slate-500">
                {(entry.file.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <span className="ml-3 text-[11px]">
                {entry.status === "pending" && "Bereit"}
                {entry.status === "uploading" && "Wird hochgeladen…"}
                {entry.status === "done" && "Fertig"}
                {entry.status === "error" && (
                  <span className="text-red-500">{entry.error ?? "Fehler"}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={!hasUploadable || isPending}
        onClick={handleUpload}
        className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
      >
        {isPending ? "Wird hochgeladen…" : "Fotos hochladen"}
      </button>
    </div>
  );
}

