"use client";

import { useActionState, useState } from "react";

type Note = {
  id: string;
  note: string | null;
  actor_role: string | null;
  created_at: string;
};

type NoteState = { success?: boolean; message?: string };

import { addClaimNoteAction } from "./claim-note-actions";

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
  const [state, formAction, pending] = useActionState(
    async (_prev: NoteState, formData: FormData) => {
      const result = await addClaimNoteAction(_prev, formData);
      if (result.success && result.newNote) {
        setNotes((prev) => [...prev, result.newNote!]);
      }
      return result;
    },
    {} as NoteState & { newNote?: Note },
  );

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
        <form action={formAction} className="flex gap-2">
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
            disabled={pending}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? "…" : "Speichern"}
          </button>
        </form>
      )}
      {state.message && (
        <p className={`text-xs ${state.success ? "text-emerald-600" : "text-red-600"}`}>
          {state.message}
        </p>
      )}
    </section>
  );
}
