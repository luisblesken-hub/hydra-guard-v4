"use client";

import { useActionState, useState } from "react";
import { inviteTenantAction, type InviteState } from "./invite-actions";

const INITIAL: InviteState = {};

type Invitation = {
  id: string;
  email: string | null;
  token: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

export function InviteClient({
  reportId,
  invitations,
}: {
  reportId: string;
  invitations: Invitation[];
}) {
  const [state, formAction, pending] = useActionState(inviteTenantAction, INITIAL);
  const [copiedFor, setCopiedFor] = useState<string | null>(null);

  function copy(token: string) {
    const url = `${window.location.origin}/mieter-einladung/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedFor(token);
    setTimeout(() => setCopiedFor(null), 2000);
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Mieter-Zugang</h2>
      <p className="text-xs text-slate-500">
        Der Mieter kann den Schaden lesen (schreibgeschützt) und wird per Link eingeladen.
      </p>

      {invitations.length > 0 && (
        <ul className="space-y-2">
          {invitations.map((inv) => {
            const expired = new Date(inv.expires_at) < new Date();
            return (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-800">{inv.email}</p>
                  <p className="text-xs text-slate-500">
                    Gültig bis{" "}
                    {new Intl.DateTimeFormat("de-DE", { dateStyle: "short" }).format(
                      new Date(inv.expires_at),
                    )}
                    {inv.used_at ? " · angenommen" : expired ? " · abgelaufen" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copy(inv.token)}
                  disabled={expired}
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  {copiedFor === inv.token ? "✓ Kopiert" : "Link kopieren"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <input type="hidden" name="reportId" value={reportId} />
        <label className="flex flex-1 flex-col gap-1 text-xs text-slate-600">
          E-Mail des Mieters
          <input
            type="email"
            name="email"
            required
            placeholder="mieter@beispiel.de"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "…" : "Einladen"}
        </button>
      </form>

      {state.message && (
        <p className={`text-xs ${state.success ? "text-emerald-600" : "text-red-600"}`}>
          {state.message}
        </p>
      )}
    </section>
  );
}
