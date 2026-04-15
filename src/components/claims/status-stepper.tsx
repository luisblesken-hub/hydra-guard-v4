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

  return (
    <div className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-0">
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const future = i > currentIdx;

          return (
            <li key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    done
                      ? "bg-emerald-500 text-white"
                      : active
                        ? "bg-indigo-600 text-white ring-2 ring-indigo-200"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  className={`mt-1 max-w-[60px] text-center text-[10px] leading-tight ${
                    active ? "font-semibold text-indigo-700" : future ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mb-4 h-0.5 w-8 ${done ? "bg-emerald-400" : "bg-slate-200"}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
