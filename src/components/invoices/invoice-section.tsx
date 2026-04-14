import { createAdminClient } from "@/lib/supabase/admin";
import { InvoiceClient } from "./invoice-client";

export type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  amount_net: number;
  amount_gross: number | null;
  vat_rate: number;
  status: string;
  submitted_at: string;
  approved_at: string | null;
  paid_at: string | null;
};

type InvoiceSectionProps = {
  reportId: string;
  userId: string;
  role: string | null;
};

export async function InvoiceSection({
  reportId,
  userId,
  role,
}: InvoiceSectionProps) {
  const admin = createAdminClient();

  const { data: invoicesData } = await admin
    .from("sanierer_invoices")
    .select(
      "id, invoice_number, amount_net, amount_gross, vat_rate, status, submitted_at, approved_at, paid_at",
    )
    .eq("report_id", reportId)
    .order("submitted_at", { ascending: false });

  const invoices: InvoiceRow[] = (invoicesData ?? []) as InvoiceRow[];

  // Sanierer: prüfen ob Assignment existiert (damit Einreichen erlaubt)
  let canSubmit = false;
  if (role === "sanierer") {
    const { data: assignment } = await admin
      .from("assignments")
      .select("id")
      .eq("report_id", reportId)
      .eq("sanierer_id", userId)
      .limit(1)
      .maybeSingle();
    canSubmit = Boolean(assignment);
  }

  return (
    <InvoiceClient
      reportId={reportId}
      role={role}
      canSubmit={canSubmit}
      invoices={invoices}
    />
  );
}
