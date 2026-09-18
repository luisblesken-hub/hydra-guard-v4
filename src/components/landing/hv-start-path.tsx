const STEPS = [
  {
    n: "01",
    title: "Objekt anlegen",
    text: "Adresse und Bestand erfassen — einmalig.",
  },
  {
    n: "02",
    title: "Melde-Link teilen",
    text: "QR oder Link an Mieter; Meldung ohne eigenes Konto.",
  },
  {
    n: "03",
    title: "Akte führen",
    text: "Fotos, Sanierer und Freigaben am selben Vorgang.",
  },
] as const;

export function HvStartPath() {
  return (
    <section
      id="startpfad"
      className="scroll-mt-16 border-b border-hg-line bg-white"
      aria-labelledby="startpfad-heading"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="hg-kicker">Hausverwaltung</p>
        <h2
          id="startpfad-heading"
          className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-hg-ink sm:text-3xl"
        >
          In drei Schritten arbeitsfähig.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Der kürzeste Weg vom Konto zur ersten Meldung — ohne Workshop und
          ohne Parallel-Systeme.
        </p>
        <ol className="mt-12 grid grid-cols-1 gap-0 border-y border-hg-line sm:grid-cols-3 sm:divide-x sm:divide-hg-line">
          {STEPS.map((step) => (
            <li key={step.n} className="border-b border-hg-line py-8 last:border-b-0 sm:border-b-0 sm:px-8 sm:first:pl-0 sm:last:pr-0">
              <p className="font-mono text-xs tracking-wider text-hg-muted">
                {step.n}
              </p>
              <p className="mt-3 text-base font-semibold text-hg-ink">
                {step.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
