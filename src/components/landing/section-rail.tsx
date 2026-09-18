"use client";

import { useEffect, useState } from "react";

const RAIL = [
  { id: "hero", label: "Start" },
  { id: "fuer-wen", label: "Für wen" },
  { id: "nutzen", label: "Nutzen" },
  { id: "startpfad", label: "Startpfad" },
  { id: "produkt", label: "Produkt" },
  { id: "ablauf", label: "Ablauf" },
  { id: "vergleich", label: "Vergleich" },
  { id: "rollen", label: "Rollen" },
  { id: "betrieb", label: "Betrieb" },
  { id: "start", label: "Konto" },
] as const;

/** Sections with dark (ink) backgrounds — rail stays light there. */
const DARK_SECTIONS = new Set<string>(["hero", "nutzen", "start"]);

export function SectionRail() {
  const [active, setActive] = useState<(typeof RAIL)[number]["id"]>("hero");

  useEffect(() => {
    function onScroll() {
      let current: (typeof RAIL)[number]["id"] = RAIL[0].id;
      let best = Number.POSITIVE_INFINITY;
      for (const item of RAIL) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const top = Math.abs(el.getBoundingClientRect().top - 96);
        if (top < best) {
          best = top;
          current = item.id;
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

  const onDark = DARK_SECTIONS.has(active);

  return (
    <nav
      aria-label="Seitenfortschritt"
      data-on-dark={onDark ? "true" : "false"}
      className="pointer-events-none fixed top-1/2 right-3 z-20 hidden -translate-y-1/2 flex-col xl:flex"
    >
      {RAIL.map((item) => {
        const isActive = active === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="pointer-events-auto group flex min-h-11 cursor-pointer items-center justify-end gap-3 py-1.5 pl-4 pr-1"
            aria-current={isActive ? "true" : undefined}
          >
            <span
              className={[
                "text-sm font-medium transition-opacity",
                onDark ? "text-white" : "text-hg-ink",
                isActive
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-90 group-focus-visible:opacity-90",
              ].join(" ")}
            >
              {item.label}
            </span>
            <span
              className={[
                "block h-3.5 w-3.5 shrink-0 rounded-sm border-2 transition-colors",
                onDark
                  ? isActive
                    ? "border-white bg-white"
                    : "border-white/75 bg-transparent group-hover:bg-white/45"
                  : isActive
                    ? "border-hg-ink bg-hg-ink"
                    : "border-hg-ink/70 bg-transparent group-hover:bg-hg-ink/35",
              ].join(" ")}
              aria-hidden="true"
            />
          </a>
        );
      })}
    </nav>
  );
}
