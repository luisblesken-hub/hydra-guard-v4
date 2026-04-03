"use client";

import { useMemo, useState } from "react";

export function MeldenPropertyLink({
  publicToken,
  label,
  street,
  city,
  postalCode,
}: {
  publicToken: string;
  label: string;
  street: string | null;
  city: string | null;
  postalCode: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const href = useMemo(() => {
    const origin = window.location.origin;
    return `${origin}/melden/${publicToken}`;
  }, [publicToken]);

  const addressLine = useMemo(() => {
    const parts = [street, postalCode, city].filter(Boolean);
    return parts.length ? parts.join(" ") : "—";
  }, [city, postalCode, street]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // If clipboard is blocked, user can still copy from the link.
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-600">{addressLine}</p>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 break-all text-sm font-medium text-indigo-700 underline"
        >
          {href}
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {copied ? "Kopiert" : "Link kopieren"}
        </button>
      </div>
    </div>
  );
}

