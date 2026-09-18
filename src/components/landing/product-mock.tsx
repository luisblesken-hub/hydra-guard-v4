/** Synthetic product UI — mirrors app tokens, no stock photography. */
export function ProductMock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`hg-landing-mock text-left ${className}`}
      style={{ transform: "none" }}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between bg-hg-ink px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-hg-accent text-[10px] font-bold text-white">
            HG
          </span>
          <span className="text-sm font-medium text-white">Schadensakte</span>
        </div>
        <span className="rounded-md bg-hg-accent/20 px-2.5 py-1 text-[11px] font-medium text-[#7dd3c7]">
          Freigegeben
        </span>
      </div>

      <div className="grid grid-cols-[1fr_0.9fr] gap-0 bg-[#f7f9fa]">
        <div className="border-r border-hg-line bg-white p-5">
          <p className="text-xs font-medium text-hg-muted">
            Musterstraße 1, Aachen
          </p>
          <p className="mt-1.5 text-base font-semibold tracking-tight text-hg-ink">
            Rohrbruch · Bad EG
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
            Melde → Sanierung → Rechnung → Versicherung in einer Akte.
          </p>

          <div className="mt-6 flex gap-1.5">
            {["Meldung", "Sanierung", "Rechnung", "Zahlung"].map((step, i) => (
              <div key={step} className="min-w-0 flex-1">
                <div
                  className={[
                    "h-1.5 w-full rounded-full",
                    i < 3 ? "bg-hg-accent" : "bg-hg-line",
                  ].join(" ")}
                />
                <p className="mt-1.5 truncate text-[10px] text-hg-muted">{step}</p>
              </div>
            ))}
          </div>

          <dl className="mt-6 space-y-2.5 border-t border-hg-line pt-5">
            {[
              ["Schätzung", "8.500 €"],
              ["Rechnung", "8.200 €"],
              ["Status", "Zur Zahlung"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-[13px]">
                <dt className="text-hg-muted">{k}</dt>
                <dd className="font-medium text-hg-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-hg-muted">Aktivität</p>
          <ul className="mt-4 space-y-3.5">
            {[
              ["Heute", "Rechnung freigegeben"],
              ["Gestern", "Trocknungsprotokoll aktualisiert"],
              ["Mo", "Sanierer zugewiesen"],
              ["Fr", "Meldung eingegangen"],
            ].map(([when, what]) => (
              <li key={what} className="border-b border-hg-line/80 pb-3 last:border-0">
                <p className="text-[11px] text-hg-muted">{when}</p>
                <p className="mt-0.5 text-[13px] font-medium text-hg-ink">{what}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
