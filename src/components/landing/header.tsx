"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "fuer-wen", label: "Für wen" },
  { id: "nutzen", label: "Nutzen" },
  { id: "produkt", label: "Produkt" },
  { id: "ablauf", label: "Ablauf" },
  { id: "betrieb", label: "Betrieb" },
  { id: "start", label: "Start" },
] as const;

export function LandingHeader() {
  const [active, setActive] = useState<string>("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);

      let current = "";
      let best = Number.POSITIVE_INFINITY;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        const top = Math.abs(el.getBoundingClientRect().top - 96);
        if (top < best) {
          best = top;
          current = section.id;
        }
      }
      setActive(current);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onScroll);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-hg-ink">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10"
        aria-hidden="true"
      >
        <div
          className="h-full bg-hg-accent transition-[width] duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded bg-hg-accent text-[11px] font-bold tracking-wide text-white">
            HG
          </span>
          <span className="hg-display hidden text-[1.05rem] font-semibold text-white sm:inline">
            HydraGuard
          </span>
        </Link>

        <nav
          aria-label="Abschnitte"
          className="hidden items-center gap-1 md:flex"
        >
          {SECTIONS.map((section) => {
            const isActive = active === section.id;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={[
                  "rounded-sm px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-[#9aa8b0] hover:text-white",
                ].join(" ")}
              >
                {section.label}
              </a>
            );
          })}
        </nav>

        <nav aria-label="Konto" className="flex shrink-0 items-center gap-2">
          <Link
            href="/login"
            className="hg-btn-outline-invert px-3 py-1.5 text-[13px] sm:px-3 sm:py-2 sm:text-sm"
          >
            Anmelden
          </Link>
          <Link
            href="/signup?role=owner"
            className="hg-btn-invert px-3 py-1.5 text-[13px] sm:px-3 sm:py-2 sm:text-sm"
          >
            Registrieren
          </Link>
        </nav>
      </div>
    </header>
  );
}
