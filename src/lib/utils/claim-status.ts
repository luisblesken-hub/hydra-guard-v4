export function statusLabel(status: string): string {
  switch (status) {
    // Legacy UI statuses (pre-claim_status enum alignment)
    case "new":
      return "Neu gemeldet";
    case "assigned":
      return "Sanierer zugewiesen";
    case "in_progress":
      return "In Bearbeitung";
    case "invoice_pending":
      return "Rechnung offen";
    case "completed":
      return "Abgeschlossen";
    case "closed":
      return "Archiviert";

    // DB enum values from `supabase/migrations/0002_hydra_guard_full.sql` (`claim_status`)
    case "draft":
      return "Entwurf";
    case "submitted":
      return "Eingereicht";
    case "validating":
      return "In Prüfung";
    case "calculating":
      return "Kalkulation";
    case "reviewing":
      return "In Freigabe";
    case "approved":
      return "Freigegeben";
    case "dispatched":
      return "Beauftragt";
    case "in_remediation":
      return "In Sanierung";
    case "invoice_submitted":
      return "Rechnung eingereicht";
    case "invoice_approved":
      return "Rechnung freigegeben";
    case "out_of_scope":
      return "Gutachter beauftragt";
    case "rejected":
      return "Abgelehnt";
    default:
      return status;
  }
}

export function statusColor(status: string): string {
  switch (status) {
    // Legacy UI statuses (pre-claim_status enum alignment)
    case "new":
      return "bg-blue-100 text-blue-800";
    case "assigned":
      return "bg-yellow-100 text-yellow-800";
    case "in_progress":
      return "bg-orange-100 text-orange-800";
    case "invoice_pending":
      return "bg-red-100 text-red-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "closed":
      return "bg-gray-100 text-gray-800";

    // DB enum values from `supabase/migrations/0002_hydra_guard_full.sql` (`claim_status`)
    case "draft":
      return "bg-slate-100 text-slate-700";
    case "submitted":
      return "bg-blue-100 text-blue-800";
    case "validating":
      return "bg-indigo-100 text-indigo-800";
    case "calculating":
      return "bg-orange-100 text-orange-800";
    case "reviewing":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-emerald-100 text-emerald-800";
    case "dispatched":
      return "bg-teal-100 text-teal-800";
    case "in_remediation":
      return "bg-emerald-100 text-emerald-800";
    case "invoice_submitted":
      return "bg-red-100 text-red-800";
    case "invoice_approved":
      return "bg-green-100 text-green-800";
    case "closed":
      return "bg-gray-100 text-gray-800";
    case "out_of_scope":
      return "bg-red-100 text-red-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function splitLabel(split: string | null | undefined): string {
  if (!split) return "—";
  switch (split) {
    // DB enum values from `supabase/migrations/0002_hydra_guard_full.sql` (`insurance_scope`)
    case "building":
      return "Gebäude";
    case "contents":
      return "Hausrat";
    case "liability":
      return "Haftpflicht";
    case "disputed":
      return "Streitfall";

    // Legacy UI values
    case "gebaeude":
      return "Gebäude";
    case "hausrat":
      return "Hausrat";
    case "haftpflicht":
      return "Haftpflicht";
    default:
      return split;
  }
}

