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
      <div className="hg-landing-hero-veil pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl items-center gap-12 px-6 py-20 sm:py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
        <div className="hg-landing-rise">
          <p className="hg-kicker-invert">Early Access · Pilot Aachen</p>
          <p
            id="landing-brand"
            className="hg-display mt-6 max-w-4xl text-[clamp(3.5rem,10vw,6.5rem)] leading-[0.88] text-white"
          >
            HydraGuard
          </p>
          <h1 className="mt-8 max-w-xl text-2xl font-medium leading-snug tracking-tight text-white sm:text-3xl">
            Eine Akte für den gesamten Wasserschaden.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-[#b8c5cd] sm:text-lg">
            Hausverwaltungen, Sanierer und Versicherer arbeiten im selben
            Vorgang — nachvollziehbar, mit Deploy in der EU.
          </p>
          <div className="mt-11 flex flex-wrap items-center gap-3">
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

        <div
          className="hg-landing-rise relative hidden lg:block"
          style={{ animationDelay: "120ms", transform: "none" }}
        >
          <ProductMock className="w-full" />
        </div>

        <a
          href="#fuer-wen"
          className="absolute bottom-8 left-6 hidden text-sm font-medium text-[#8a9aa4] transition-colors hover:text-white sm:block"
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
