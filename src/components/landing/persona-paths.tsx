"use client";

import Link from "next/link";
import { useId, useState } from "react";

const PATHS = [
  {
    id: "owner",
    signupRole: "owner",
    label: "Hausverwaltung",
    want: "Eine Akte statt Postfach-Chaos",
    dayOne: [
      "Objekt anlegen und Melde-Link an Mieter geben",
      "Neue Meldungen inkl. Fotos sofort in der Akte sehen",
      "Sanierer zuweisen und Freigaben steuern",
    ],
    cta: "Als Hausverwaltung starten",
  },
  {
    id: "sanierer",
    signupRole: "sanierer",
    label: "Sanierer",
    want: "Auftrag, Protokoll und Rechnung ohne Medienbruch",
    dayOne: [
      "Zugewiesene Aufträge annehmen und Status führen",
      "Trocknung dokumentieren — in derselben Akte",
      "Leistung digital einreichen, ohne separates PDF",
    ],
    cta: "Als Sanierer starten",
  },
  {
    id: "insurer",
    signupRole: "versicherung",
    label: "Versicherer",
    want: "Prüfen, freigeben, exportieren — nachvollziehbar",
    dayOne: [
      "Vorgang inkl. Fotos und Schätzung öffnen",
      "Rechnung gegen Systemschätzung abgleichen",
      "PDF-/CSV-Export und Zahlungsstatus führen",
    ],
    cta: "Als Versicherer starten",
  },
] as const;

export function PersonaPaths() {
  const labelId = useId();
  const [active, setActive] = useState(0);
  const path = PATHS[active];

  return (
    <section
      id="fuer-wen"
      className="scroll-mt-16 border-b border-hg-line bg-white"
      aria-labelledby={labelId}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="hg-kicker">Sofort-Einstieg</p>
        <h2
          id={labelId}
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-hg-ink sm:text-4xl"
        >
          Was wollen Sie zuerst sehen?
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Wählen Sie Ihre Rolle — wir zeigen den ersten Arbeitstag, nicht die
          Feature-Liste.
        </p>

        <div
          className="mt-8 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Zielgruppe"
        >
          {PATHS.map((p, i) => {
            const selected = i === active;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="persona-panel"
                id={`persona-tab-${p.id}`}
                onClick={() => setActive(i)}
                className={[
                  "min-w-[9rem] flex-1 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors",
                  selected
                    ? "border-hg-ink bg-hg-ink text-white"
                    : "border-hg-line bg-white text-hg-ink hover:border-hg-accent/40",
                ].join(" ")}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div
          id="persona-panel"
          role="tabpanel"
          aria-labelledby={`persona-tab-${path.id}`}
          className="hg-landing-fade mt-8 rounded-2xl border border-hg-line bg-hg-canvas p-6 sm:p-10"
          key={path.id}
        >
          <p className="hg-kicker">Sofort-Nutzen</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-hg-ink sm:text-2xl">
            {path.want}
          </h3>
          <ol className="mt-8 space-y-0 border-t border-hg-line">
            {path.dayOne.map((item, i) => (
              <li
                key={item}
                className="flex gap-4 border-b border-hg-line py-4 last:border-b-0"
              >
                <span className="font-mono text-xs tracking-wider text-hg-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-relaxed text-slate-700">
                  {item}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={`/signup?role=${path.signupRole}`}
              className="hg-btn-primary px-5 py-2.5"
            >
              {path.cta}
            </Link>
            <a
              href="#rollen"
              className="text-sm font-medium text-hg-steel underline-offset-4 hover:underline"
            >
              Alle Rollen im Detail
            </a>
          </div>
        </div>

        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-slate-500">
          Mieter brauchen kein Konto: Sie melden über den Token-Link der
          Hausverwaltung — Fotos und Angaben landen direkt in der Akte.
        </p>
      </div>
    </section>
  );
}
