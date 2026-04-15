type ClaimSummaryProps = {
  id: string;
  status: string;
  category: string;
  estimatedAmount: number;
  invoiceAmount?: number | null;
  address: string;
  createdAt: string;
  confirmedCause?: string | null;
};

const CATEGORY_DE: Record<string, string> = {
  pipe_burst: "Rohrbruch",
  appliance_leak: "Geräteschaden",
  human_error: "Menschliches Versehen",
  roof_leak: "Dachleck",
  unknown: "Unbekannt",
};

function formatEUR(v: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
}

export function ClaimSummaryCard({
  id,
  status,
  category,
  estimatedAmount,
  invoiceAmount,
  address,
  createdAt,
  confirmedCause,
}: ClaimSummaryProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">{address}</p>
          <p className="text-sm text-slate-500">
            {CATEGORY_DE[category] ?? category}
            {" · "}
            {new Intl.DateTimeFormat("de-DE", { dateStyle: "short" }).format(new Date(createdAt))}
          </p>
          {confirmedCause && (
            <p className="text-xs italic text-slate-500">{confirmedCause}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-slate-900">{formatEUR(estimatedAmount)}</p>
          {invoiceAmount && invoiceAmount !== estimatedAmount && (
            <p className={`text-xs ${invoiceAmount > estimatedAmount ? "text-red-500" : "text-emerald-600"}`}>
              Abrechnung: {formatEUR(invoiceAmount)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
