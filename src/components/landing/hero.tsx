import Link from "next/link";
import { LANDING_DEMO_MAILTO } from "./contact";
import { ProductMock } from "./product-mock";

export function LandingHero() {
  return (
    <section
      id="hero"
      className="hg-landing-hero relative overflow-hidden"
      aria-labelledby="landing-brand"
    >
      <div className="hg-landing-hero-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-hg-ink via-hg-ink/90 to-hg-ink/40 lg:via-hg-ink/75 lg:to-transparent" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl items-center gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
        <div className="hg-landing-rise">
          <p className="hg-kicker-invert">Early Access · Pilot Aachen</p>
          <p
            id="landing-brand"
            className="hg-display mt-5 max-w-4xl text-[clamp(3.25rem,9vw,6rem)] leading-[0.9] text-white"
          >
            HydraGuard
          </p>
          <h1 className="mt-7 max-w-xl text-xl font-medium tracking-tight text-white sm:text-2xl">
            Eine Akte für den gesamten Wasserschaden.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#c5d0d6]">
            Hausverwaltungen, Sanierer und Versicherer arbeiten im selben
            Vorgang — nachvollziehbar, mit Deploy in der EU.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/signup?role=owner" className="hg-btn-invert">
              Konto anlegen
            </Link>
            <a href={LANDING_DEMO_MAILTO} className="hg-btn-outline-invert">
              Demo anfragen
            </a>
            <a
              href="#fuer-wen"
              className="ml-1 text-sm text-[#9aa8b0] underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Für Ihre Rolle
            </a>
          </div>
        </div>

        <div className="relative hidden lg:block" style={{ transform: "none" }}>
          <ProductMock className="w-full" />
        </div>

        <a
          href="#fuer-wen"
          className="absolute bottom-8 left-6 hidden text-xs font-medium text-[#9aa8b0] transition-colors hover:text-white sm:block"
        >
          Weiter
          <span className="hg-landing-cue ml-2 inline-block" aria-hidden="true">
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}
