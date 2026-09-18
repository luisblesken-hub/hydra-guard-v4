"use client";

import { useId, useState } from "react";

const SLIDES = [
  {
    id: "analog",
    kicker: "Ausgangslage",
    title: "Wasserschäden verlieren sich in Postfächern, Ordnern und Anrufen.",
    body: "Eine Meldung kommt per E-Mail. Fotos liegen auf dem Mobiltelefon. Der Sanierer sendet ein eigenes PDF. Die Versicherung fordert Unterlagen an, die niemand mehr findet. Freigaben und Fristen laufen daneben — ohne gemeinsamen Stand.",
    rows: [
      { label: "Meldung", value: "E-Mail / Telefon" },
      { label: "Fotos", value: "Geräteordner, WhatsApp" },
      { label: "Sanierung", value: "Separates PDF" },
      { label: "Freigabe", value: "Unklar, wer den Stand hat" },
    ],
  },
  {
    id: "hydra",
    kicker: "Vorgehen",
    title: "Ein Vorgang. Ein Stand. Eine Akte.",
    body: "HydraGuard führt Meldung, Sanierung, Rechnung und Versicherungsprüfung in einem dokumentierten Ablauf zusammen. Jede Rolle arbeitet am selben Vorgang — ohne parallele Versionen und ohne Medienbruch.",
    rows: [
      { label: "Meldung", value: "Gemeinsame Akte" },
      { label: "Fotos", value: "In der Akte, ohne GPS" },
      { label: "Sanierung", value: "Protokoll & Status live" },
      { label: "Freigabe", value: "Nachvollziehbarer Pfad" },
    ],
  },
] as const;

export function ContrastSlides() {
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  return (
    <section
      id="vergleich"
      className="scroll-mt-16 bg-hg-canvas"
      aria-labelledby={labelId}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <p className="hg-kicker">Vergleich</p>
        <h2
          id={labelId}
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-hg-ink sm:text-4xl"
        >
          Vom Medienbruch zur gemeinsamen Akte.
        </h2>

        <div
          className="mt-8 inline-flex border border-hg-line bg-white p-1"
          role="tablist"
          aria-label="Vergleichsansicht"
        >
          {SLIDES.map((s, i) => {
            const active = i === index;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setIndex(i)}
                className={[
                  "px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-hg-ink text-white"
                    : "text-slate-600 hover:bg-hg-canvas hover:text-hg-ink",
                ].join(" ")}
              >
                {s.id === "analog" ? "Analog" : "HydraGuard"}
              </button>
            );
          })}
        </div>

        <div
          key={slide.id}
          className="hg-landing-fade mt-8 grid gap-0 overflow-hidden rounded-2xl border border-hg-line bg-white lg:grid-cols-2"
          role="tabpanel"
        >
          <div className="border-b border-hg-line p-6 sm:p-10 lg:border-b-0 lg:border-r">
            <p className="hg-kicker">{slide.kicker}</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-hg-ink sm:text-2xl">
              {slide.title}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              {slide.body}
            </p>
          </div>
          <dl className="divide-y divide-hg-line">
            {slide.rows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[7rem_1fr] gap-4 px-6 py-5 sm:grid-cols-[9rem_1fr] sm:px-10"
              >
                <dt className="text-xs font-medium text-hg-muted">
                  {row.label}
                </dt>
                <dd className="text-sm font-medium text-hg-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
