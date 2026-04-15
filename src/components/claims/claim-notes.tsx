"use client";

import { useActionState, useState, useTransition } from "react";
import { addClaimNoteAction } from "./claim-note-actions";

type Note = {
  id: string;
  note: string | null;
  actor_role: string | null;
  created_at: string;
};

const ROLE_LABEL: Record<string, string> = {
  owner: "Eigentümer",
  sanierer: "Sanierer",
  versicherung: "Versicherung",
  mieter: "Mieter",
  admin: "Admin",
};

export function ClaimNotes({
  reportId,
  initialNotes,
  canAdd,
}: {
  reportId: string;
  initialNotes: Note[];
  canAdd: boolean;
}) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0); // reset form

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addClaimNoteAction({}, formData);
      if (result.success && result.newNote) {
        setNotes((prev) => [...prev, result.newNote as Note]);
        setInputKey((k) => k + 1);
        setErrorMsg(null);
      } else {
        setErrorMsg(result.message ?? "Fehler");
      }
    });
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">
        Notizen
        <span className="ml-2 text-xs font-normal text-slate-400">
          {notes.length > 0 ? `${notes.length} Einträge` : ""}
        </span>
      </h2>

      {notes.length === 0 ? (
        <p className="text-xs text-slate-400">Noch keine Notizen vorhanden.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-slate-700">{n.note}</p>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-slate-400">
                    {n.actor_role ? ROLE_LABEL[n.actor_role] ?? n.actor_role : "System"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Intl.DateTimeFormat("de-DE", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(n.created_at))}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canAdd && (
        <form key={inputKey} action={handleSubmit} className="flex gap-2">
          <input type="hidden" name="reportId" value={reportId} />
          <input
            type="text"
            name="note"
            required
            maxLength={500}
            placeholder="Notiz hinzufügen…"
            className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? "…" : "Speichern"}
          </button>
        </form>
      )}
      {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
    </section>
  );
}
