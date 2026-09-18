"use client";

import { useId, useState } from "react";
import { LANDING_CONTACT_EMAIL, LANDING_DEMO_MAILTO } from "./contact";

const TRUST = [
  {
    id: "eu",
    title: "EU-Betrieb",
    short: "Vercel EU · Ausrichtung DSGVO",
    text: "Die Anwendung wird über Vercel in der Europäischen Union bereitgestellt. Datenhaltung und Auth laufen über Supabase. Ziel ist durchgängig europäischer Betrieb — Details zur Region und Auftragsverarbeitung folgen im AVV.",
  },
  {
    id: "dsgvo",
    title: "DSGVO",
    short: "Rollenbasierte Zugriffe",
    text: "Personenbezogene Daten werden nach europäischen Datenschutzvorgaben verarbeitet. Zugriffe sind rollenbasiert; wesentliche Änderungen am Vorgang sind nachvollziehbar.",
  },
  {
    id: "exif",
    title: "EXIF-Strip",
    short: "Fotos ohne GPS-Metadaten",
    text: "GPS- und Geräteinformationen werden aus JPEG-Uploads entfernt, bevor die Datei in der Akte liegt.",
  },
  {
    id: "avv",
    title: "AVV",
    short: "Auf Anfrage · folgt vor Go-Live",
    text: `Der Auftragsverarbeitungsvertrag (AVV) wird vor produktivem Go-Live bereitgestellt. Bis dahin: Anfrage an ${LANDING_CONTACT_EMAIL}.`,
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
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-hg-ink sm:text-4xl"
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
                      selected
                        ? "text-hg-ink"
                        : "text-slate-600 hover:bg-hg-canvas/80 hover:text-hg-ink",
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
              {String(open + 1).padStart(2, "0")} / {String(TRUST.length).padStart(2, "0")}
            </p>
            <h3 className="mt-4 text-xl font-semibold text-hg-ink">{item.title}</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              {item.text}
            </p>
            {item.id === "avv" && (
              <a
                href={LANDING_DEMO_MAILTO}
                className="mt-6 inline-flex text-sm font-medium text-hg-steel underline-offset-4 hover:underline"
              >
                AVV / Demo anfragen
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
