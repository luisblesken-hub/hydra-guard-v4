"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-red-500">!</p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          Etwas ist schiefgelaufen
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Wir konnten deine Anfrage nicht verarbeiten. Bitte versuche es erneut.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-slate-400">
            Ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Erneut versuchen
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
