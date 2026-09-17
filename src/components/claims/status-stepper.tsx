const STEPS = [
  { key: "submitted", label: "Eingereicht" },
  { key: "dispatched", label: "Beauftragt" },
  { key: "in_remediation", label: "In Sanierung" },
  { key: "invoice_submitted", label: "Rechnung" },
  { key: "invoice_approved", label: "Freigegeben" },
  { key: "closed", label: "Abgeschlossen" },
] as const;

const STATUS_STEP_INDEX: Record<string, number> = {
  draft: -1,
  submitted: 0,
  validating: 0,
  calculating: 0,
  reviewing: 0,
  approved: 0,
  dispatched: 1,
  in_remediation: 2,
  invoice_submitted: 3,
  invoice_approved: 4,
  closed: 5,
  rejected: -2,
  out_of_scope: -2,
};

export function StatusStepper({ status }: { status: string }) {
  const currentIdx = STATUS_STEP_INDEX[status] ?? 0;

  if (currentIdx < 0) return null; // Sonderstatus – kein Stepper sinnvoll

  // `approved` sits on step 0 but must not read as "Eingereicht"
  const currentLabel =
    status === "approved"
      ? "Freigegeben"
      : (STEPS[currentIdx]?.label ?? "Unbekannt");

  return (
    <div className="overflow-x-auto" role="region" aria-label={`Fortschritt: ${currentLabel}`}>
      <ol className="flex min-w-max items-center gap-0" aria-label="Schadensfall-Fortschritt">
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const future = i > currentIdx;
          const label =
            status === "approved" && i === 0 ? "Freigegeben" : step.label;

          return (
            <li
              key={step.key}
              className="flex items-center"
              aria-current={active ? "step" : undefined}
              aria-label={`Schritt ${i + 1}: ${label}${done ? " (abgeschlossen)" : active ? " (aktuell)" : ""}`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded text-[11px] font-semibold transition-colors ${
                    done
                      ? "bg-hg-ink text-white"
                      : active
                        ? "bg-hg-steel text-white"
                        : "border border-slate-300 bg-white text-slate-500"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  className={`mt-1 max-w-[60px] text-center text-[10px] leading-tight ${
                    active ? "font-semibold text-hg-ink" : future ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mb-4 h-px w-8 ${done ? "bg-hg-ink" : "bg-slate-200"}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
