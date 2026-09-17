"use client";

type Props = {
  claimId: string;
  address: string;
  ownerEmail?: string | null;
};

/**
 * Opens a mailto draft so insurers can request missing documents from the owner.
 * No server-side email — honest UX.
 */
export function RequestDocumentsButton({ claimId, address, ownerEmail }: Props) {
  const subject = encodeURIComponent(
    `HydraGuard — Unterlagen nachfordern (${claimId.slice(0, 8)}…)`
  );
  const body = encodeURIComponent(
    [
      "Guten Tag,",
      "",
      `zu dem Schadensfall unter „${address || "Adresse offen"}“ (ID ${claimId}) fehlen uns noch Unterlagen.`,
      "",
      "Bitte reichen Sie nach Möglichkeit nach:",
      "• aktuelle Fotos der Schadenstelle",
      "• Policennummer / Versicherungsnachweis",
      "• ggf. Feuchtigkeitsmessung / Saniererbericht",
      "",
      "Vielen Dank.",
      "",
      "— gesendet über HydraGuard (Entwurf, bitte prüfen)",
    ].join("\n")
  );
  const href = ownerEmail
    ? `mailto:${encodeURIComponent(ownerEmail)}?subject=${subject}&body=${body}`
    : `mailto:?subject=${subject}&body=${body}`;

  return (
    <a
      href={href}
      className="inline-flex w-max items-center justify-center rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
    >
      Dokumente nachfordern
    </a>
  );
}
