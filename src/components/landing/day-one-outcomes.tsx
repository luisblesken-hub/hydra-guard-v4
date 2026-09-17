const OUTCOMES = [
  {
    who: "Hausverwaltung",
    result: "Melde-Link am Objekt, eingehende Fälle in einer Liste, Freigaben ohne E-Mail-Suche.",
  },
  {
    who: "Sanierer",
    result: "Zugewiesener Auftrag, Trocknungsprotokoll und Rechnung gehören zum selben Vorgang.",
  },
  {
    who: "Versicherer",
    result: "Prüfstand mit Schätzung, Fotos, Freigabe und PDF-/CSV-Export aus der Akte.",
  },
  {
    who: "Compliance",
    result: "EU-Hosting, DSGVO-Pfad, EXIF-Strip bei JPEG und nachvollziehbarer Aktivitätsverlauf.",
  },
] as const;

export function DayOneOutcomes() {
  return (
    <section
      id="nutzen"
      className="scroll-mt-16 bg-hg-ink"
      aria-labelledby="nutzen-heading"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#9aa8b0] uppercase">
          Ergebnis
        </p>
        <h2
          id="nutzen-heading"
          className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          Was jede Partei sofort braucht — und bekommt.
        </h2>
        <dl className="mt-12 grid grid-cols-1 gap-0 border-t border-white/15 sm:grid-cols-2">
          {OUTCOMES.map((item) => (
            <div
              key={item.who}
              className="border-b border-white/15 py-7 sm:odd:pr-10 sm:even:border-l sm:even:pl-10"
            >
              <dt className="text-xs font-semibold tracking-wider text-[#9aa8b0] uppercase">
                {item.who}
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-[#c5d0d6] sm:text-base">
                {item.result}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
