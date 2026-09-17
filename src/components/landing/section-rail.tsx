"use client";

import { useEffect, useState } from "react";

const RAIL = [
  { id: "hero", label: "Start" },
  { id: "ablauf", label: "Ablauf" },
  { id: "vergleich", label: "Vergleich" },
  { id: "rollen", label: "Rollen" },
  { id: "betrieb", label: "Betrieb" },
  { id: "start", label: "Konto" },
] as const;

export function SectionRail() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    function onScroll() {
      let current = "hero";
      for (const item of RAIL) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= window.innerHeight * 0.45) {
          current = item.id;
        }
      }
      setActive(current);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Seitenfortschritt"
      className="pointer-events-none fixed top-1/2 right-4 z-20 hidden -translate-y-1/2 flex-col gap-3 mix-blend-difference xl:flex"
    >
      {RAIL.map((item) => {
        const isActive = active === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="pointer-events-auto group flex items-center justify-end gap-3"
            aria-current={isActive ? "true" : undefined}
          >
            <span
              className={[
                "text-[10px] font-medium tracking-wider text-white uppercase transition-opacity",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-80",
              ].join(" ")}
            >
              {item.label}
            </span>
            <span
              className={[
                "block h-2 w-2 rounded-[1px] border border-white transition-colors",
                isActive ? "bg-white" : "bg-transparent group-hover:bg-white/40",
              ].join(" ")}
            />
          </a>
        );
      })}
    </nav>
  );
}
