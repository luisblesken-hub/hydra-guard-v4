import { ProductMock } from "./product-mock";

export function ProductShowcase() {
  return (
    <section
      id="produkt"
      className="scroll-mt-16 bg-hg-canvas"
      aria-labelledby="produkt-heading"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16">
          <div>
            <p className="hg-kicker">Produkt</p>
            <h2
              id="produkt-heading"
              className="mt-3 text-3xl font-semibold tracking-tight text-hg-ink sm:text-4xl"
            >
              Die Akte, nicht das Postfach.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
              Status, Schätzung, Rechnung und Verlauf liegen in einem Vorgang —
              so wie Hausverwaltung, Sanierer und Versicherer gemeinsam
              arbeiten.
            </p>
            <p className="mt-6 text-sm font-medium text-hg-accent">
              Early Access · Pilot Aachen
            </p>
          </div>
          <ProductMock className="w-full max-w-xl lg:justify-self-end" />
        </div>
      </div>
    </section>
  );
}
