"use client";

import { useCallback, useEffect, useId, useState } from "react";

const STEPS = [
  {
    n: "01",
    title: "Meldung",
    lead: "Schaden erfassen und in einer Akte bündeln.",
    detail:
      "Adresse, Beschreibung und Fotos landen im selben Vorgang. Kein separates Postfach, keine verstreuten Anhänge.",
    points: [
      "Token-basierte Meldung ohne Login für Mieter",
      "Fotos ohne GPS-/Geräte-Metadaten",
      "Sofortige Sichtbarkeit für die Hausverwaltung",
    ],
  },
  {
    n: "02",
    title: "Sanierung",
    lead: "Auftrag, Trocknung und Fortschritt dokumentieren.",
    detail:
      "Sanierer arbeiten am gemeinsamen Stand: Zuweisung, Termin, Trocknungsprotokoll und Aktivitätsverlauf.",
    points: [
      "Auftrag annehmen und Status führen",
      "Trocknungskurve als nachvollziehbares Protokoll",
      "Termine und Kontakt für Beteiligte sichtbar",
    ],
  },
  {
    n: "03",
    title: "Rechnung",
    lead: "Leistung abrechnen und zur Freigabe vorlegen.",
    detail:
      "Rechnungen gehören zur Akte — mit Betrag, Status und Abgleich zur Schadenschätzung.",
    points: [
      "Digitale Einreichung durch den Sanierer",
      "Freigabe- und Ablehnungspfad für Eigentümer",
      "Vergleich Rechnung vs. Systemschätzung",
    ],
  },
  {
    n: "04",
    title: "Versicherung",
    lead: "Prüfen, freigeben, zahlen — mit Export.",
    detail:
      "Versicherer sehen denselben Vorgang, erteilen Freigaben und exportieren PDF- sowie CSV-Unterlagen.",
    points: [
      "Prüfungs- und Zahlungsstatus in der Akte",
      "Batch-Zahlung und Detailansicht",
      "Rollenbasierte PDF-/CSV-Exporte",
    ],
  },
] as const;

export function ProcessSlides() {
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const step = STEPS[index];

  const go = useCallback((next: number) => {
    setIndex((next + STEPS.length) % STEPS.length);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      const root = document.getElementById("ablauf");
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.75 && rect.bottom > 80;
      if (!inView) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  return (
    <section
      id="ablauf"
      className="scroll-mt-16 border-b border-hg-line bg-white"
      aria-labelledby={labelId}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="hg-kicker">Ablauf</p>
            <h2
              id={labelId}
              className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-hg-ink sm:text-3xl"
            >
              Vier Schritte, ein Vorgang.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-slate-600">
            Folien durchblättern — mit den Pfeiltasten, wenn dieser Abschnitt
            im Blick ist.
          </p>
        </div>

        <div
          className="mt-10 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Ablaufschritte"
        >
          {STEPS.map((s, i) => {
            const active = i === index;
            return (
              <button
                key={s.n}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="ablauf-panel"
                id={`ablauf-tab-${s.n}`}
                onClick={() => setIndex(i)}
                className={[
                  "min-w-[7.5rem] flex-1 border px-3 py-3 text-left transition-colors",
                  active
                    ? "border-hg-ink bg-hg-ink text-white"
                    : "border-hg-line bg-white text-hg-ink hover:border-hg-steel/40",
                ].join(" ")}
              >
                <span
                  className={[
                    "font-mono text-[11px] tracking-wider",
                    active ? "text-white/80" : "text-hg-muted",
                  ].join(" ")}
                >
                  {s.n}
                </span>
                <span className="mt-1 block text-sm font-semibold">{s.title}</span>
              </button>
            );
          })}
        </div>

        <div
          className="mt-1 h-0.5 w-full bg-hg-line"
          aria-hidden="true"
        >
          <div
            className="h-full bg-hg-steel transition-[width] duration-300 ease-out"
            style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div
          id="ablauf-panel"
          role="tabpanel"
          aria-labelledby={`ablauf-tab-${step.n}`}
          className="hg-landing-fade mt-10 grid gap-10 border border-hg-line bg-hg-canvas p-6 sm:p-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
          key={step.n}
        >
          <div>
            <p className="font-mono text-xs tracking-wider text-hg-muted">
              Schritt {step.n}
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-hg-ink sm:text-2xl">
              {step.title}
            </h3>
            <p className="mt-3 text-base font-medium text-hg-steel">{step.lead}</p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
              {step.detail}
            </p>
          </div>
          <ul className="space-y-0 border-t border-hg-line lg:border-t-0 lg:border-l lg:pl-10">
            {step.points.map((point) => (
              <li
                key={point}
                className="border-b border-hg-line py-4 text-sm leading-relaxed text-slate-700 last:border-b-0"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="hg-btn-secondary px-4 py-2"
            aria-label="Vorheriger Schritt"
          >
            Zurück
          </button>
          <p className="font-mono text-xs tracking-wider text-hg-muted">
            {String(index + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
          </p>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="hg-btn-primary px-4 py-2"
            aria-label="Nächster Schritt"
          >
            Weiter
          </button>
        </div>
      </div>
    </section>
  );
}
