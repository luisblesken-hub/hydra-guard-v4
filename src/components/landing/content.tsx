import Link from "next/link";

const STEPS = [
  {
    n: "01",
    title: "Meldung",
    text: "Schaden erfassen, Fotos und Angaben in einer Akte bündeln.",
  },
  {
    n: "02",
    title: "Sanierung",
    text: "Auftrag, Trocknungsprotokoll und Fortschritt dokumentieren.",
  },
  {
    n: "03",
    title: "Rechnung",
    text: "Leistung abrechnen und zur Freigabe vorlegen.",
  },
  {
    n: "04",
    title: "Versicherung",
    text: "Prüfen, freigeben, zahlen — mit PDF- und CSV-Export.",
  },
] as const;

const ROLES = [
  {
    title: "Eigentümer",
    text: "Objekte führen, Meldungen aufnehmen, Sanierer beauftragen und Rechnungen freigeben.",
  },
  {
    title: "Sanierer",
    text: "Aufträge annehmen, die Trocknung protokollieren und Leistungen digital abrechnen.",
  },
  {
    title: "Versicherer",
    text: "Vorgänge prüfen, Freigaben erteilen, Zahlungen erfassen und Exporte erstellen.",
  },
] as const;

const TRUST = [
  {
    title: "EU-Hosting",
    text: "Der Dienst wird in der Europäischen Union betrieben.",
  },
  {
    title: "DSGVO",
    text: "Personenbezogene Daten werden nach europäischen Datenschutzvorgaben verarbeitet.",
  },
  {
    title: "EXIF-Strip",
    text: "GPS- und Geräteinformationen werden aus JPEG-Uploads entfernt.",
  },
  {
    title: "Audit-Trail",
    text: "Wesentliche Änderungen am Vorgang bleiben nachvollziehbar.",
  },
] as const;

export function LandingContent() {
  return (
    <>
      <section
        id="inhalt"
        className="scroll-mt-16 border-b border-hg-line bg-white"
        aria-labelledby="ablauf-heading"
      >
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <p className="hg-kicker">Ablauf</p>
          <h2
            id="ablauf-heading"
            className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-hg-ink sm:text-3xl"
          >
            Vier Schritte, ein Vorgang.
          </h2>
          <ol className="mt-12 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.n}>
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

      <section className="bg-hg-canvas" aria-labelledby="problem-heading">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:py-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <div>
            <p className="hg-kicker">Ausgangslage</p>
            <h2
              id="problem-heading"
              className="mt-3 text-2xl font-semibold tracking-tight text-hg-ink sm:text-3xl"
            >
              Wasserschäden zerfallen in Postfächer, Ordner und Anrufe.
            </h2>
          </div>
          <p className="max-w-xl self-center text-base leading-relaxed text-slate-600">
            Eine Meldung kommt per E-Mail. Fotos liegen auf dem Mobiltelefon.
            Der Sanierer sendet ein eigenes PDF. Die Versicherung fordert
            Unterlagen an, die niemand mehr findet. Freigaben und Fristen
            laufen daneben — ohne gemeinsamen Stand.
          </p>
        </div>
      </section>

      <section className="border-y border-hg-line bg-white" aria-labelledby="loesung-heading">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:py-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <div>
            <p className="hg-kicker">Vorgehen</p>
            <h2
              id="loesung-heading"
              className="mt-3 text-2xl font-semibold tracking-tight text-hg-ink sm:text-3xl"
            >
              Ein Vorgang. Ein Stand. Eine Akte.
            </h2>
          </div>
          <p className="max-w-xl self-center text-base leading-relaxed text-slate-600">
            HydraGuard führt Meldung, Sanierung, Rechnung und
            Versicherungsprüfung in einem dokumentierten Ablauf zusammen. Jede
            Rolle arbeitet am selben Vorgang — ohne parallele Versionen und
            ohne Medienbruch.
          </p>
        </div>
      </section>

      <section className="bg-white" aria-labelledby="rollen-heading">
        <div className="mx-auto max-w-6xl px-6 pb-16 sm:pb-24">
          <p className="hg-kicker">Beteiligte</p>
          <h2
            id="rollen-heading"
            className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-hg-ink sm:text-3xl"
          >
            Drei Rollen, derselbe Vorgang.
          </h2>
          <ul className="mt-12 grid grid-cols-1 divide-y divide-hg-line border-y border-hg-line lg:grid-cols-3 lg:divide-x lg:divide-y-0 lg:divide-hg-line">
            {ROLES.map((role) => (
              <li key={role.title} className="py-8 lg:px-8 lg:py-10 lg:first:pl-0 lg:last:pr-0">
                <h3 className="text-base font-semibold text-hg-ink">{role.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {role.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-hg-canvas" aria-labelledby="betrieb-heading">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <p className="hg-kicker">Betrieb</p>
          <h2
            id="betrieb-heading"
            className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-hg-ink sm:text-3xl"
          >
            Ausgelegt auf Nachvollziehbarkeit und Datenschutz.
          </h2>
          <dl className="mt-12 grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2">
            {TRUST.map((item) => (
              <div key={item.title} className="border-t border-hg-line pt-5">
                <dt className="text-sm font-semibold text-hg-ink">{item.title}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.text}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-hg-ink" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <h2
            id="cta-heading"
            className="max-w-xl text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          >
            Vorgänge an einem Ort führen.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#c5d0d6]">
            Legen Sie ein Konto an oder melden Sie sich an — für
            Hausverwaltungen, Sanierer und Versicherer.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/signup" className="hg-btn-invert">
              Konto anlegen
            </Link>
            <Link href="/login" className="hg-btn-outline-invert">
              Anmelden
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
