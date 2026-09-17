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
      className="hg-btn-secondary"
    >
      {copied ? "Kopiert" : "Link kopieren"}
    </button>
  );
}
