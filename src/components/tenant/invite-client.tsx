"use client";

import { useActionState, useState, useEffect } from "react";
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
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  function inviteUrl(token: string) {
    return `${origin}/mieter-einladung/${token}`;
  }

  function copy(token: string) {
    navigator.clipboard.writeText(inviteUrl(token));
    setCopiedFor(token);
    setTimeout(() => setCopiedFor(null), 2000);
  }

  return (
    <section className="space-y-3 rounded-lg border border-hg-line bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Mieter-Zugang</h2>
      <p className="text-xs text-slate-500">
        Der Mieter kann den Schaden lesen (schreibgeschützt). Link kopieren oder per E-Mail
        weiterleiten (kein automatischer Versand).
      </p>

      {invitations.length > 0 && (
        <ul className="space-y-2">
          {invitations.map((inv) => {
            const expired = new Date(inv.expires_at) < new Date();
            const url = inviteUrl(inv.token);
            const mailto =
              inv.email && origin
                ? `mailto:${encodeURIComponent(inv.email)}?subject=${encodeURIComponent(
                    "Einladung: Wasserschaden in HydraGuard verfolgen"
                  )}&body=${encodeURIComponent(
                    `Guten Tag,\n\nüber diesen Link können Sie den Stand Ihres Wasserschadens einsehen:\n${url}\n\nMit freundlichen Grüßen`
                  )}`
                : null;
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
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copy(inv.token)}
                    disabled={expired || !origin}
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    {copiedFor === inv.token ? "✓ Kopiert" : "Link kopieren"}
                  </button>
                  {mailto && !expired && (
                    <a
                      href={mailto}
                      className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-hg-steel hover:bg-slate-100"
                    >
                      Per E-Mail senden
                    </a>
                  )}
                </div>
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
          className="inline-flex items-center justify-center rounded-md bg-hg-steel px-3 py-1.5 text-xs font-semibold text-white hover:bg-hg-ink disabled:opacity-50"
        >
          {pending ? "…" : "Einladen"}
        </button>
      </form>

      {state.message && (
        <p className={`text-xs ${state.success ? "text-hg-steel" : "text-red-600"}`}>
          {state.message}
        </p>
      )}
    </section>
  );
}
