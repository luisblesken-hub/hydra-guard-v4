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
    default:
      return status;
  }
}

export function statusColor(status: string): string {
  switch (status) {
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
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function splitLabel(split: string | null | undefined): string {
  if (!split) return "—";
  switch (split) {
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

