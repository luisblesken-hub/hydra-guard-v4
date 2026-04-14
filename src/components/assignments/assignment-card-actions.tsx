"use client";

import { useTransition, useState, useActionState } from "react";
import {
  updateAssignmentStatusAction,
  setConfirmedCauseAction,
  type AssignmentActionState,
} from "./assignment-actions";

const INITIAL: AssignmentActionState = {};

type Props = {
  assignmentId: string;
  reportId: string;
  currentStatus: string;
  hasConfirmedCause: boolean;
};

export function AssignmentCardActions({
  assignmentId,
  reportId,
  currentStatus,
  hasConfirmedCause,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showCauseForm, setShowCauseForm] = useState(false);

  const [causeState, causeFormAction, causePending] = useActionState(
    setConfirmedCauseAction,
    INITIAL,
  );

  function handleStatusUpdate(newStatus: "accepted" | "in_progress" | "completed") {
    startTransition(async () => {
      const res = await updateAssignmentStatusAction(assignmentId, newStatus);
      setStatusMsg(res.message ?? null);
    });
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Status-Aktionen */}
      <div className="flex flex-wrap gap-2">
        {currentStatus === "pending" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleStatusUpdate("accepted")}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Annehmen
          </button>
        )}
        {(currentStatus === "accepted" || currentStatus === "pending") && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleStatusUpdate("in_progress")}
            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            In Arbeit setzen
          </button>
        )}
        {currentStatus === "in_progress" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleStatusUpdate("completed")}
            className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            Abschließen
          </button>
        )}
        {!hasConfirmedCause && currentStatus !== "pending" && (
          <button
            type="button"
            onClick={() => setShowCauseForm((v) => !v)}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {showCauseForm ? "Abbrechen" : "Ursache bestätigen"}
          </button>
        )}
      </div>

      {statusMsg && (
        <p className="text-xs text-slate-500">{statusMsg}</p>
      )}

      {/* Confirmed-Cause Formular */}
      {showCauseForm && (
        <form action={causeFormAction} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <input type="hidden" name="reportId" value={reportId} />
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Bestätigte Schadensursache
            <textarea
              name="confirmed_cause"
              rows={2}
              required
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              placeholder="z.B. Defekte Zuleitung unter der Badewanne, Rohrbruch durch Frostschäden..."
            />
          </label>
          <button
            type="submit"
            disabled={causePending}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {causePending ? "Speichert…" : "Ursache speichern"}
          </button>
          {causeState.message && (
            <p className={`text-xs ${causeState.success ? "text-emerald-600" : "text-red-600"}`}>
              {causeState.message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
