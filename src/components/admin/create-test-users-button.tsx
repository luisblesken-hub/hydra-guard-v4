"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import {
  createTestUsersAction,
  type CreateTestUsersState,
} from "./create-test-users-action";
import {
  createSampleClaimAction,
  type SampleClaimState,
} from "./create-sample-claim-action";

export function CreateSampleClaimButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SampleClaimState | null>(null);

  function run() {
    startTransition(async () => {
      const r = await createSampleClaimAction();
      setResult(r);
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={isPending}
        className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {isPending ? "Legt an…" : "📋 Beispiel-Schaden erstellen"}
      </button>
      {result && (
        <p className={`text-xs ${result.success ? "text-emerald-700" : "text-red-600"}`}>
          {result.message}
          {result.claimId && (
            <>
              {" — "}
              <Link
                href={`/claims/${result.claimId}`}
                className="font-medium underline"
              >
                Öffnen
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}

export function CreateTestUsersButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CreateTestUsersState | null>(null);

  function run() {
    if (
      !confirm(
        "Testnutzer (Sanierer, Versicherung, Mieter) anlegen? Passwörter werden einmalig angezeigt.",
      )
    )
      return;
    startTransition(async () => {
      const r = await createTestUsersAction();
      setResult(r);
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={isPending}
        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? "Legt an…" : "🧪 Testnutzer anlegen"}
      </button>
      {result && (
        <div className="rounded-lg bg-slate-50 p-3">
          {result.message && (
            <p className={`text-xs ${result.success ? "text-emerald-700" : "text-red-600"}`}>
              {result.message}
            </p>
          )}
          {result.created && result.created.length > 0 && (
            <table className="mt-2 w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-1 pr-4">E-Mail</th>
                  <th className="py-1 pr-4">Rolle</th>
                  <th className="py-1">Passwort</th>
                </tr>
              </thead>
              <tbody>
                {result.created.map((u) => (
                  <tr key={u.email}>
                    <td className="py-1 pr-4 font-mono">{u.email}</td>
                    <td className="py-1 pr-4">{u.role}</td>
                    <td className="py-1 font-mono">
                      {u.password.startsWith("FEHLER") ? (
                        <span className="text-red-600">{u.password}</span>
                      ) : u.password === "(bereits vorhanden)" ? (
                        <span className="text-slate-500">{u.password}</span>
                      ) : (
                        <code className="rounded bg-slate-200 px-1">{u.password}</code>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-2 text-[10px] text-slate-400">
            Notiere die Passwörter — sie werden nach dem Schließen nicht mehr angezeigt.
          </p>
        </div>
      )}
    </div>
  );
}
