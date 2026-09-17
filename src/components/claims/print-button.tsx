"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="hg-btn-secondary print:hidden"
    >
      Drucken
    </button>
  );
}
