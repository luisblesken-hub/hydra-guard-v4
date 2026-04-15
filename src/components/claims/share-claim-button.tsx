"use client";

import { useState } from "react";

export function ShareClaimButton({ claimId }: { claimId: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const url = `${window.location.origin}/claims/${claimId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Link zur Schadenakte kopieren"
      className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      {copied ? "✓ Kopiert" : "🔗 Link kopieren"}
    </button>
  );
}
