"use client";

import { useId, useState } from "react";

const TRUST = [
  {
    id: "eu",
    title: "EU-Hosting",
    short: "Betrieb in der Europäischen Union",
    text: "Der Dienst wird in der Europäischen Union betrieben. Infrastruktur und Datenhaltung bleiben im europäischen Rechtsraum.",
  },
  {
    id: "dsgvo",
    title: "DSGVO",
    short: "Europäische Datenschutzvorgaben",
    text: "Personenbezogene Daten werden nach europäischen Datenschutzvorgaben verarbeitet. Zugriffe sind rollenbasiert und protokolliert.",
  },
  {
    id: "exif",
    title: "EXIF-Strip",
    short: "Fotos ohne GPS-Metadaten",
    text: "GPS- und Geräteinformationen werden aus JPEG-Uploads entfernt, bevor die Datei in der Akte liegt.",
  },
  {
    id: "audit",
    title: "Audit-Trail",
    short: "Änderungen nachvollziehbar",
    text: "Wesentliche Änderungen am Vorgang bleiben im Aktivitätsverlauf nachvollziehbar — für Freigaben, Status und Dokumentation.",
  },
] as const;

export function TrustPanel() {
  const labelId = useId();
  const [open, setOpen] = useState(0);
  const item = TRUST[open];

  return (
    <section
      id="betrieb"
      className="scroll-mt-16 bg-hg-canvas"
      aria-labelledby={labelId}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <p className="hg-kicker">Betrieb</p>
        <h2
          id={labelId}
          className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-hg-ink sm:text-3xl"
        >
          Ausgelegt auf Nachvollziehbarkeit und Datenschutz.
        </h2>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <ul className="border-y border-hg-line">
            {TRUST.map((t, i) => {
              const selected = i === open;
              return (
                <li key={t.id} className="border-b border-hg-line last:border-b-0">
                  <button
                    type="button"
                    aria-expanded={selected}
                    onClick={() => setOpen(i)}
                    className={[
                      "flex w-full items-start justify-between gap-4 py-5 text-left transition-colors",
                      selected ? "text-hg-ink" : "text-slate-600 hover:text-hg-ink",
                    ].join(" ")}
                  >
                    <span>
                      <span className="block text-sm font-semibold">{t.title}</span>
                      <span className="mt-1 block text-sm text-slate-500">
                        {t.short}
                      </span>
                    </span>
                    <span
                      className={[
                        "mt-1 font-mono text-xs tracking-wider",
                        selected ? "text-hg-steel" : "text-hg-muted",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      {selected ? "—" : "+"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div
            key={item.id}
            className="hg-landing-fade border border-hg-line bg-white p-6 sm:p-10"
          >
            <p className="font-mono text-xs tracking-wider text-hg-muted">
              {String(open + 1).padStart(2, "0")} / 04
            </p>
            <h3 className="mt-4 text-xl font-semibold text-hg-ink">{item.title}</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              {item.text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
