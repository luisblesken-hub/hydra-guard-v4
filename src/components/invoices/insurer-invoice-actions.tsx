"use client";

import { useTransition, useState } from "react";
import { markInvoicePaidAction } from "./invoice-actions";

export function InsurerInvoiceActions({
  invoiceId,
  reportId,
}: {
  invoiceId: string;
  reportId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return <span className="text-xs font-medium text-green-600">✓ Als bezahlt markiert</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await markInvoicePaidAction(invoiceId);
            if (result.success) {
              setDone(true);
            } else {
              setMessage(result.message ?? "Fehler");
            }
          })
        }
        className="inline-flex items-center rounded-md bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {isPending ? "…" : "Als bezahlt markieren"}
      </button>
      {message && <p className="text-xs text-red-500">{message}</p>}
    </div>
  );
}
