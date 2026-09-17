import Link from "next/link";
import { ContrastSlides } from "./contrast-slides";
import { DayOneOutcomes } from "./day-one-outcomes";
import { PersonaPaths } from "./persona-paths";
import { ProcessSlides } from "./process-slides";
import { RoleExplorer } from "./role-explorer";
import { TrustPanel } from "./trust-panel";

export function LandingContent() {
  return (
    <>
      <div id="inhalt">
        <PersonaPaths />
      </div>
      <DayOneOutcomes />
      <ProcessSlides />
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
            Mit der richtigen Rolle starten.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#c5d0d6]">
            Die Registrierung übernimmt Ihre Rolle vorausgewählt — Sie landen
            danach im passenden Dashboard.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/signup?role=owner"
              className="hg-btn-invert justify-start px-5"
            >
              Hausverwaltung
            </Link>
            <Link
              href="/signup?role=sanierer"
              className="hg-btn-outline-invert justify-start px-5"
            >
              Sanierer
            </Link>
            <Link
              href="/signup?role=versicherung"
              className="hg-btn-outline-invert justify-start px-5"
            >
              Versicherer
            </Link>
            <Link
              href="/login"
              className="self-center text-sm text-[#9aa8b0] underline-offset-4 hover:text-white hover:underline sm:ml-2"
            >
              Bereits Konto? Anmelden
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
