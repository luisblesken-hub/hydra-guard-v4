export function statusLabel(status: string): string {
  switch (status) {
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

/** Muted, border-first badges — less “app candy”, more dossier. */
export function statusColor(status: string): string {
  switch (status) {
    case "new":
    case "submitted":
    case "validating":
      return "border-slate-300 bg-slate-50 text-slate-700";
    case "assigned":
    case "reviewing":
    case "calculating":
      return "border-slate-300 bg-white text-slate-700";
    case "approved":
    case "dispatched":
    case "in_progress":
    case "in_remediation":
      return "border-hg-steel/30 bg-hg-steel/5 text-hg-steel";
    case "invoice_pending":
    case "invoice_submitted":
      return "border-amber-300/80 bg-amber-50 text-amber-900";
    case "invoice_approved":
    case "completed":
      return "border-slate-400 bg-slate-100 text-slate-800";
    case "closed":
    case "draft":
      return "border-slate-200 bg-slate-50 text-slate-500";
    case "out_of_scope":
    case "rejected":
      return "border-red-300/70 bg-red-50 text-red-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export function splitLabel(split: string | null | undefined): string {
  if (!split) return "—";
  switch (split) {
    case "building":
      return "Gebäude";
    case "contents":
      return "Hausrat";
    case "liability":
      return "Haftpflicht";
    case "disputed":
      return "Streitfall";
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
