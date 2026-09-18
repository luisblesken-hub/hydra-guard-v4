"use client";

import Link from "next/link";
import { useId, useState } from "react";

const ROLES = [
  {
    id: "owner",
    signupRole: "owner",
    title: "Eigentümer",
    subtitle: "Hausverwaltung & Vermieter",
    text: "Objekte führen, Meldungen aufnehmen, Sanierer beauftragen und Rechnungen freigeben.",
    capabilities: [
      "Objekte und Melde-Links verwalten",
      "Schadensfälle filtern, sortieren und exportieren",
      "Sanierer zuweisen und Statusaktionen setzen",
      "Rechnungen prüfen und freigeben",
    ],
  },
  {
    id: "sanierer",
    signupRole: "sanierer",
    title: "Sanierer",
    subtitle: "Ausführung & Dokumentation",
    text: "Aufträge annehmen, die Trocknung protokollieren und Leistungen digital abrechnen.",
    capabilities: [
      "Pool-Aufträge annehmen und Priorität setzen",
      "Trocknungsprotokoll und Termin führen",
      "Quick-Invoice in der Akte einreichen",
      "Umsatz- und Aktivitätsübersicht nutzen",
    ],
  },
  {
    id: "insurer",
    signupRole: "versicherung",
    title: "Versicherer",
    subtitle: "Prüfung & Zahlung",
    text: "Vorgänge prüfen, Freigaben erteilen, Zahlungen erfassen und Exporte erstellen.",
    capabilities: [
      "Claims und Rechnungen im Prüfstand führen",
      "Systemschätzung mit Rechnung vergleichen",
      "Einzel- und Batch-Zahlung erfassen",
      "PDF- und CSV-Exporte für die Akte",
    ],
  },
] as const;

export function RoleExplorer() {
  const labelId = useId();
  const [active, setActive] = useState(0);
  const role = ROLES[active];

  return (
    <section
      id="rollen"
      className="scroll-mt-16 border-y border-hg-line bg-white"
      aria-labelledby={labelId}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <p className="hg-kicker">Beteiligte</p>
        <h2
          id={labelId}
          className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-hg-ink sm:text-3xl"
        >
          Drei Rollen, derselbe Vorgang.
        </h2>

        <div className="mt-10 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
          <div
            role="tablist"
            aria-label="Rollen"
            className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-0 lg:overflow-visible lg:border-l lg:border-hg-line"
          >
            {ROLES.map((r, i) => {
              const selected = i === active;
              return (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="rollen-panel"
                  id={`rollen-tab-${r.id}`}
                  onClick={() => setActive(i)}
                  className={[
                    "shrink-0 border px-4 py-3 text-left text-sm transition-colors lg:border-0 lg:border-l-2 lg:-ml-px lg:rounded-none",
                    selected
                      ? "border-hg-ink bg-hg-ink text-white lg:border-l-hg-ink lg:bg-transparent lg:pl-[calc(1rem-2px)] lg:font-semibold lg:text-hg-ink"
                      : "border-hg-line text-slate-600 hover:border-hg-steel/40 hover:text-hg-ink lg:border-l-transparent lg:hover:border-l-hg-line",
                  ].join(" ")}
                >
                  <span className="block font-medium">{r.title}</span>
                  <span
                    className={[
                      "mt-0.5 hidden text-xs lg:block",
                      selected ? "text-hg-muted" : "text-slate-400",
                    ].join(" ")}
                  >
                    {r.subtitle}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            id="rollen-panel"
            role="tabpanel"
            aria-labelledby={`rollen-tab-${role.id}`}
            className="hg-landing-fade"
            key={role.id}
          >
            <p className="text-sm font-medium text-hg-muted">
              {role.subtitle}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-hg-ink">{role.title}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {role.text}
            </p>
            <ol className="mt-8 grid gap-0 border-t border-hg-line sm:grid-cols-2">
              {role.capabilities.map((item, i) => (
                <li
                  key={item}
                  className="flex gap-4 border-b border-hg-line py-5 sm:odd:border-r sm:odd:pr-6 sm:even:pl-6"
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
            <div className="mt-8">
              <Link
                href={`/signup?role=${role.signupRole}`}
                className="hg-btn-primary px-5 py-2.5"
              >
                Konto als {role.title} anlegen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
