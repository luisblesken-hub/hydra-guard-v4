import Link from "next/link";
import { LandingHeroVisual } from "./hero-visual";

export function LandingHero() {
  return (
    <section className="hg-landing-hero relative overflow-hidden" aria-labelledby="landing-brand">
      <div className="hg-landing-hero-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] opacity-70 lg:block">
        <LandingHeroVisual />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-hg-ink via-hg-ink/88 to-hg-ink/25 lg:via-hg-ink/80 lg:to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl flex-col justify-center px-6 py-16 sm:py-20">
        <p
          id="landing-brand"
          className="max-w-4xl text-[clamp(3.25rem,10vw,6.75rem)] font-semibold leading-[0.92] tracking-tight text-white"
        >
          HydraGuard
        </p>
        <h1 className="mt-6 max-w-xl text-xl font-medium tracking-tight text-white sm:text-2xl">
          Eine Akte für den gesamten Wasserschaden.
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-[#c5d0d6]">
          Hausverwaltungen, Sanierer und Versicherer arbeiten im selben Vorgang
          — nachvollziehbar und in der Europäischen Union gehostet.
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
  );
}
