"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export function MeldenPropertyLink({
  id,
  publicToken,
  label,
  street,
  city,
  postalCode,
}: {
  id?: string;
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
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-600">{addressLine}</p>
        </div>
        {id && (
          <Link
            href={`/properties/${id}`}
            className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Details →
          </Link>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 truncate text-xs font-medium text-indigo-600 hover:underline"
        >
          {href}
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {copied ? "✓ Kopiert" : "Link kopieren"}
        </button>
      </div>
    </div>
  );
}

