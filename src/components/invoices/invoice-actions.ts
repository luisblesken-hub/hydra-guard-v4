"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type InvoiceActionState = {
  success?: boolean;
  message?: string;
};

const SubmitSchema = z.object({
  reportId: z.string().uuid(),
  invoice_number: z.string().max(100).optional(),
  amount_net: z.coerce
    .number()
    .positive("Betrag muss > 0 sein.")
    .max(500_000, "Maximalbetrag: 500.000 €"),
  vat_rate: z.coerce.number().min(0).max(99).default(19),
});

async function getRole(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return (data?.role as string | null) ?? null;
}

/**
 * Sanierer reicht Rechnung ein. Setzt status='submitted' und
 * damage_reports.status='invoice_submitted'.
 */
export async function submitInvoiceAction(
  _prev: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  const parsed = SubmitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { success: false, message: first ?? "Ungültige Eingabe." };
  }

  const role = await getRole(user.id);
  if (role !== "sanierer") {
    return {
      success: false,
      message: "Nur Sanierer können Rechnungen einreichen.",
    };
  }

  const { reportId, invoice_number, amount_net, vat_rate } = parsed.data;
  const admin = createAdminClient();

  // Assignment des Sanierers zu diesem Report finden
  const { data: assignment } = await admin
    .from("assignments")
    .select("id, sanierer_id")
    .eq("report_id", reportId)
    .eq("sanierer_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!assignment) {
    return {
      success: false,
      message: "Kein Auftrag für diesen Schadenfall gefunden.",
    };
  }

  const { error: insertError } = await admin.from("sanierer_invoices").insert({
    assignment_id: assignment.id,
    sanierer_id: user.id,
    report_id: reportId,
    invoice_number: invoice_number || null,
    amount_net,
    vat_rate,
    status: "submitted",
  });

  if (insertError) {
    return {
      success: false,
      message: `Fehler beim Speichern: ${insertError.message}`,
    };
  }

  await admin
    .from("damage_reports")
    .update({ status: "invoice_submitted" })
    .eq("id", reportId);

  revalidatePath(`/claims/${reportId}`);
  return { success: true, message: "Rechnung eingereicht." };
}

/**
 * Owner gibt Rechnung frei. Setzt invoice.status='approved',
 * approved_at=now, damage_reports.status='invoice_approved'.
 */
export async function approveInvoiceAction(
  invoiceId: string,
): Promise<InvoiceActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  const admin = createAdminClient();
  const { data: invoice } = await admin
    .from("sanierer_invoices")
    .select("id, report_id")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) return { success: false, message: "Rechnung nicht gefunden." };

  // Verify Owner
  const { data: report } = await admin
    .from("damage_reports")
    .select("id, owner_id")
    .eq("id", invoice.report_id)
    .maybeSingle();

  if (!report || report.owner_id !== user.id) {
    return { success: false, message: "Keine Berechtigung." };
  }

  const { error: updateError } = await admin
    .from("sanierer_invoices")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", invoiceId);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  await admin
    .from("damage_reports")
    .update({ status: "invoice_approved" })
    .eq("id", invoice.report_id);

  revalidatePath(`/claims/${invoice.report_id}`);
  return { success: true, message: "Rechnung freigegeben." };
}

/**
 * Owner lehnt Rechnung ab.
 */
export async function rejectInvoiceAction(
  invoiceId: string,
): Promise<InvoiceActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  const admin = createAdminClient();
  const { data: invoice } = await admin
    .from("sanierer_invoices")
    .select("id, report_id")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) return { success: false, message: "Rechnung nicht gefunden." };

  const { data: report } = await admin
    .from("damage_reports")
    .select("id, owner_id")
    .eq("id", invoice.report_id)
    .maybeSingle();

  if (!report || report.owner_id !== user.id) {
    return { success: false, message: "Keine Berechtigung." };
  }

  const { error: updateError } = await admin
    .from("sanierer_invoices")
    .update({ status: "rejected" })
    .eq("id", invoiceId);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  revalidatePath(`/claims/${invoice.report_id}`);
  return { success: true, message: "Rechnung abgelehnt." };
}

/**
 * Insurer markiert Rechnung als bezahlt.
 */
export async function markInvoicePaidAction(
  invoiceId: string,
): Promise<InvoiceActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  const role = await getRole(user.id);
  if (role !== "versicherung") {
    return {
      success: false,
      message: "Nur Versicherer können Zahlungen markieren.",
    };
  }

  const admin = createAdminClient();
  const { data: invoice } = await admin
    .from("sanierer_invoices")
    .select("id, report_id, status")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) return { success: false, message: "Rechnung nicht gefunden." };
  if (invoice.status !== "approved") {
    return {
      success: false,
      message: "Nur freigegebene Rechnungen können bezahlt werden.",
    };
  }

  const { error: updateError } = await admin
    .from("sanierer_invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", invoiceId);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  await admin
    .from("damage_reports")
    .update({ status: "closed" })
    .eq("id", invoice.report_id);

  revalidatePath(`/claims/${invoice.report_id}`);
  return { success: true, message: "Als bezahlt markiert." };
}
