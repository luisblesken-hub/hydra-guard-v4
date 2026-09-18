/** Synthetic product UI — mirrors app tokens, no stock photography. */
export function ProductMock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden border border-hg-line bg-white text-left shadow-[0_24px_60px_-28px_rgba(11,18,32,0.55)] ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between border-b border-hg-line bg-hg-ink px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-white text-[9px] font-bold text-hg-ink">
            HG
          </span>
          <span className="text-[11px] font-medium text-white">Schadensakte</span>
        </div>
        <span className="text-[10px] tracking-wider text-[#9aa8b0] uppercase">
          Freigegeben
        </span>
      </div>

      <div className="grid grid-cols-[1fr_0.85fr] gap-0 bg-hg-canvas">
        <div className="border-r border-hg-line bg-white p-4">
          <p className="text-[10px] font-semibold tracking-wider text-hg-muted uppercase">
            Musterstraße 1, Aachen
          </p>
          <p className="mt-1 text-sm font-semibold text-hg-ink">Rohrbruch · Bad EG</p>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-600">
            Melde → Sanierung → Rechnung → Versicherung in einer Akte.
          </p>

          <div className="mt-5 flex gap-1">
            {["Meldung", "Sanierung", "Rechnung", "Zahlung"].map((step, i) => (
              <div key={step} className="min-w-0 flex-1">
                <div
                  className={[
                    "h-1 w-full",
                    i < 3 ? "bg-hg-steel" : "bg-hg-line",
                  ].join(" ")}
                />
                <p className="mt-1 truncate text-[9px] text-hg-muted">{step}</p>
              </div>
            ))}
          </div>

          <dl className="mt-5 space-y-2 border-t border-hg-line pt-4">
            {[
              ["Schätzung", "8.500 €"],
              ["Rechnung", "8.200 €"],
              ["Status", "Zur Zahlung"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-[11px]">
                <dt className="text-hg-muted">{k}</dt>
                <dd className="font-medium text-hg-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="p-4">
          <p className="text-[10px] font-semibold tracking-wider text-hg-muted uppercase">
            Aktivität
          </p>
          <ul className="mt-3 space-y-3">
            {[
              ["Heute", "Rechnung freigegeben"],
              ["Gestern", "Trocknungsprotokoll aktualisiert"],
              ["Mo", "Sanierer zugewiesen"],
              ["Fr", "Meldung eingegangen"],
            ].map(([when, what]) => (
              <li key={what} className="border-b border-hg-line pb-2 last:border-0">
                <p className="font-mono text-[9px] text-hg-muted">{when}</p>
                <p className="mt-0.5 text-[11px] text-hg-ink">{what}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
