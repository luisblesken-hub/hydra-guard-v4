"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type BatchPayState = { success?: boolean; message?: string; count?: number };

const Schema = z.object({
  invoiceIds: z.string().transform((s) => s.split(",").filter(Boolean)),
});

/**
 * Versicherung bezahlt mehrere freigegebene Rechnungen auf einmal.
 */
export async function batchMarkPaidAction(
  _prev: BatchPayState,
  formData: FormData,
): Promise<BatchPayState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Nicht authentifiziert." };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "versicherung") return { success: false, message: "Nur für Versicherer." };

  const parsed = Schema.safeParse({ invoiceIds: formData.get("invoiceIds") });
  if (!parsed.success || parsed.data.invoiceIds.length === 0) {
    return { success: false, message: "Keine Rechnungen ausgewählt." };
  }

  const { invoiceIds } = parsed.data;
  const now = new Date().toISOString();

  const { data: invoices } = await admin
    .from("sanierer_invoices")
    .select("id, report_id, status")
    .in("id", invoiceIds)
    .eq("status", "approved");

  if (!invoices || invoices.length === 0) {
    return { success: false, message: "Keine freigegebenen Rechnungen gefunden." };
  }

  const { error } = await admin
    .from("sanierer_invoices")
    .update({ status: "paid", paid_at: now })
    .in("id", invoices.map((i) => i.id));

  if (error) return { success: false, message: error.message };

  // Reports auf closed setzen
  for (const inv of invoices) {
    await admin
      .from("damage_reports")
      .update({ status: "closed" })
      .eq("id", inv.report_id);

    await admin.from("activity_feed").insert({
      report_id: inv.report_id,
      actor_id: user.id,
      actor_role: "versicherung",
      event_type: "invoice_paid",
      note: "Rechnung bezahlt (Batch)",
    });
  }

  revalidatePath("/dashboard/insurer");
  return { success: true, message: `${invoices.length} Rechnung(en) als bezahlt markiert.`, count: invoices.length };
}
