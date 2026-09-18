import { LANDING_CONTACT_EMAIL, LANDING_DEMO_MAILTO } from "./contact";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-hg-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-xs text-[#9aa8b0] sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p>© 2026 HydraGuard · Aachen</p>
          <p>Early Access · Pilot Aachen</p>
        </div>
        <div className="space-y-1 sm:text-right">
          <p>Wasserschaden-Management für Eigentümer, Sanierer und Versicherer.</p>
          <p>
            Kontakt:{" "}
            <a
              href={`mailto:${LANDING_CONTACT_EMAIL}`}
              className="text-[#c5d0d6] underline-offset-2 hover:underline"
            >
              {LANDING_CONTACT_EMAIL}
            </a>
            {" · "}
            <a
              href={LANDING_DEMO_MAILTO}
              className="text-[#c5d0d6] underline-offset-2 hover:underline"
            >
              Demo
            </a>
          </p>
          <p>AVV folgt vor Go-Live · auf Anfrage</p>
        </div>
      </div>
    </footer>
  );
}
