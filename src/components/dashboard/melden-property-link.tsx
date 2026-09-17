"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

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
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const href = useMemo(() => {
    if (!origin) return "";
    return `${origin}/melden/${publicToken}`;
  }, [origin, publicToken]);

  const addressLine = useMemo(() => {
    const parts = [street, postalCode, city].filter(Boolean);
    return parts.length ? parts.join(" ") : "—";
  }, [city, postalCode, street]);

  const qrUrl = href
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(href)}`
    : "";

  async function copyLink() {
    if (!href) return;
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  function printQr() {
    if (!href || !qrUrl) return;
    const w = window.open("", "_blank", "noopener,noreferrer,width=420,height=560");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Melde-QR ${label}</title>
      <style>
        body{font-family:system-ui,sans-serif;text-align:center;padding:24px;color:#0f172a}
        img{width:220px;height:220px;margin:16px auto;display:block}
        p{font-size:13px;color:#475569;word-break:break-all}
        h1{font-size:18px;margin:0}
      </style></head><body>
      <h1>HydraGuard — Schaden melden</h1>
      <p><strong>${label}</strong><br/>${addressLine}</p>
      <img src="${qrUrl}" alt="QR-Code Melde-Link" />
      <p>${href}</p>
      <p>QR-Code scannen und Wasserschaden melden</p>
      <script>window.onload=()=>window.print()</script>
      </body></html>`);
    w.document.close();
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

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {qrUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrUrl}
            alt="QR-Code zum Melde-Link"
            width={72}
            height={72}
            className="rounded border border-slate-200 bg-white"
          />
        ) : (
          <div className="h-[72px] w-[72px] animate-pulse rounded bg-slate-100" />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <a
            href={href || undefined}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-xs font-medium text-indigo-600 hover:underline"
          >
            {href || "Link wird geladen…"}
          </a>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyLink}
              disabled={!href}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {copied ? "✓ Kopiert" : "Link kopieren"}
            </button>
            <button
              type="button"
              onClick={printQr}
              disabled={!href}
              className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
            >
              QR drucken
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
