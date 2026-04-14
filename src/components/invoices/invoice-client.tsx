"use client";

import { useActionState, useTransition, useState } from "react";
import {
  submitInvoiceAction,
  approveInvoiceAction,
  rejectInvoiceAction,
  markInvoicePaidAction,
  type InvoiceActionState,
} from "./invoice-actions";
import type { InvoiceRow } from "./invoice-section";

const INITIAL: InvoiceActionState = {};

const STATUS_DE: Record<string, string> = {
  submitted: "Eingereicht",
  under_review: "In Prüfung",
  approved: "Freigegeben",
  rejected: "Abgelehnt",
  paid: "Bezahlt",
};

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
};

function formatEUR(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type InvoiceClientProps = {
  reportId: string;
  role: string | null;
  canSubmit: boolean;
  invoices: InvoiceRow[];
};

export function InvoiceClient({
  reportId,
  role,
  canSubmit,
  invoices,
}: InvoiceClientProps) {
  const [state, formAction, pending] = useActionState(
    submitInvoiceAction,
    INITIAL,
  );
  const [isPending, startTransition] = useTransition();
  const [rowMessage, setRowMessage] = useState<Record<string, string>>({});

  function runAction(
    invoiceId: string,
    action: (id: string) => Promise<InvoiceActionState>,
  ) {
    startTransition(async () => {
      const result = await action(invoiceId);
      setRowMessage((prev) => ({
        ...prev,
        [invoiceId]:
          result.message ?? (result.success ? "Erfolg." : "Fehler."),
      }));
    });
  }

  const showSubmitForm = role === "sanierer" && canSubmit;

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Rechnungen</h2>
        <span className="text-xs text-slate-500">
          {invoices.length} Rechnung{invoices.length === 1 ? "" : "en"}
        </span>
      </header>

      {invoices.length === 0 ? (
        <p className="text-xs text-slate-500">Noch keine Rechnungen vorhanden.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {invoices.map((inv) => {
            const canApproveReject =
              role === "owner" &&
              (inv.status === "submitted" || inv.status === "under_review");
            const canMarkPaid =
              role === "versicherung" && inv.status === "approved";
            const msg = rowMessage[inv.id];
            return (
              <li key={inv.id} className="flex flex-col gap-2 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLE[inv.status] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_DE[inv.status] ?? inv.status}
                    </span>
                    <span className="font-mono text-xs text-slate-500">
                      {inv.invoice_number ?? `#${inv.id.slice(0, 8)}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatEUR(inv.amount_gross ?? inv.amount_net)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Netto {formatEUR(inv.amount_net)} · {inv.vat_rate}% MwSt
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Eingereicht: {formatDate(inv.submitted_at)}
                  {inv.approved_at
                    ? ` · Freigegeben: ${formatDate(inv.approved_at)}`
                    : ""}
                  {inv.paid_at ? ` · Bezahlt: ${formatDate(inv.paid_at)}` : ""}
                </div>
                {(canApproveReject || canMarkPaid) && (
                  <div className="flex flex-wrap gap-2">
                    {canApproveReject && (
                      <>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            runAction(inv.id, approveInvoiceAction)
                          }
                          className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Freigeben
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            runAction(inv.id, rejectInvoiceAction)
                          }
                          className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Ablehnen
                        </button>
                      </>
                    )}
                    {canMarkPaid && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          runAction(inv.id, markInvoicePaidAction)
                        }
                        className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Als bezahlt markieren
                      </button>
                    )}
                  </div>
                )}
                {msg && (
                  <p className="text-xs text-slate-600">{msg}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {showSubmitForm && (
        <form
          action={formAction}
          className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <input type="hidden" name="reportId" value={reportId} />
          <h3 className="text-xs font-semibold text-slate-700">
            Neue Rechnung einreichen
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs text-slate-600">
              Rechnungsnr.
              <input
                type="text"
                name="invoice_number"
                placeholder="R-2026-001"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-600">
              Netto (€)
              <input
                type="number"
                name="amount_net"
                step="0.01"
                min="0"
                required
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-600">
              MwSt %
              <input
                type="number"
                name="vat_rate"
                step="0.01"
                min="0"
                max="99"
                defaultValue={19}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? "Wird eingereicht…" : "Rechnung einreichen"}
          </button>
          {state.message && (
            <p
              className={`text-xs ${
                state.success ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {state.message}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
