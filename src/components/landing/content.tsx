import Link from "next/link";
import { ContrastSlides } from "./contrast-slides";
import { ProcessSlides } from "./process-slides";
import { RoleExplorer } from "./role-explorer";
import { TrustPanel } from "./trust-panel";

export function LandingContent() {
  return (
    <>
      <div id="inhalt">
        <ProcessSlides />
      </div>
      <ContrastSlides />
      <RoleExplorer />
      <TrustPanel />

      <section
        id="start"
        className="scroll-mt-16 bg-hg-ink"
        aria-labelledby="cta-heading"
      >
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#9aa8b0] uppercase">
            Nächster Schritt
          </p>
          <h2
            id="cta-heading"
            className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          >
            Vorgänge an einem Ort führen.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#c5d0d6]">
            Legen Sie ein Konto an oder melden Sie sich an — für
            Hausverwaltungen, Sanierer und Versicherer.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/signup" className="hg-btn-invert">
              Konto anlegen
            </Link>
            <Link href="/login" className="hg-btn-outline-invert">
              Anmelden
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
