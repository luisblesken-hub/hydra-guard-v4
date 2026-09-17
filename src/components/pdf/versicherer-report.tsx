import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PdfPhotoImage } from "@/lib/pdf/load-photo-images";
import { splitLabel, statusLabel } from "@/lib/utils/claim-status";

export type VersichererReportData = {
  report: {
    id: string;
    status: string;
    damage_amount_estimate: number;
    insurance_split: string | null;
    reported_cause: string | null;
    confirmed_cause: string | null;
    description: string | null;
    claim_tier: string | null;
    created_at: string;
  };
  property: {
    address: string;
    city: string | null;
    zip: string | null;
    building_type: string | null;
  };
  photos: PdfPhotoImage[];
  activityFeed: Array<{
    action: string;
    created_at: string;
  }>;
  invoices: Array<{
    amount: number;
    status: string;
    created_at: string;
  }>;
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("de-DE");
}

function formatDateShort(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE");
}

function formatEUR(amount: number) {
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function tierLabel(tier: string | null) {
  if (tier === "auto_track") return "Standard-Track (≤ 12.500 €)";
  if (tier === "out_of_scope") return "Gutachter-Track (> 12.500 €)";
  if (tier === "expert_track") return "Experte (Legacy)";
  return tier || "—";
}

function invoiceStatusDe(status: string) {
  switch (status) {
    case "draft":
      return "Entwurf";
    case "submitted":
      return "Eingereicht";
    case "approved":
      return "Freigegeben";
    case "paid":
      return "Bezahlt";
    case "rejected":
      return "Abgelehnt";
    default:
      return status;
  }
}

function severityDe(s: string | null | undefined) {
  switch (s) {
    case "low":
      return "gering";
    case "medium":
      return "mittel";
    case "high":
      return "hoch";
    case "critical":
      return "kritisch";
    default:
      return "—";
  }
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  header: {
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#4F46E5",
    marginBottom: 14,
  },
  brand: { fontSize: 11, color: "#4F46E5", fontWeight: 700, marginBottom: 2 },
  title: { fontSize: 16, fontWeight: 700, color: "#111827" },
  subtitle: { marginTop: 3, fontSize: 9, color: "#4B5563" },
  section: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 3,
  },
  label: { color: "#6B7280", fontWeight: 600, fontSize: 9 },
  value: { color: "#111827", textAlign: "right", flexShrink: 1, fontSize: 9 },
  body: { fontSize: 9, color: "#374151", marginTop: 4 },
  listItem: {
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginBottom: 3,
  },
  small: { fontSize: 8, color: "#374151" },
  footerNote: { marginTop: 6, color: "#6B7280", fontSize: 7 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    padding: 6,
    marginBottom: 6,
  },
  photoImg: {
    width: "100%",
    height: 140,
    objectFit: "cover",
    borderRadius: 2,
    backgroundColor: "#F3F4F6",
  },
  photoPlaceholder: {
    width: "100%",
    height: 80,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  photoCaption: { marginTop: 4, fontSize: 8, color: "#374151" },
  photoMeta: { fontSize: 7, color: "#6B7280", marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 28,
    right: 28,
    fontSize: 7,
    color: "#9CA3AF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 6,
  },
});

export function VersichererReportDocument({
  data,
}: {
  data: VersichererReportData;
}) {
  const { report, property, photos, activityFeed, invoices } = data;
  const cause = report.confirmed_cause || report.reported_cause || "—";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>Hydra Guard</Text>
          <Text style={styles.title}>Kleines Schadensgutachten</Text>
          <Text style={styles.subtitle}>
            Versicherer-Unterlage · Schaden-ID: {report.id}
          </Text>
          <Text style={styles.subtitle}>
            Erstellt: {formatDate(report.created_at)}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: "#EEF2FF" }]}>
          <Text style={styles.sectionTitle}>Kurzfazit</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{statusLabel(report.status)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Schätzwert</Text>
            <Text style={styles.value}>
              {formatEUR(report.damage_amount_estimate)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Track</Text>
            <Text style={styles.value}>{tierLabel(report.claim_tier)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ursache</Text>
            <Text style={styles.value}>{cause}</Text>
          </View>
          {report.description ? (
            <Text style={styles.body}>{report.description}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Immobilie</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Adresse</Text>
            <Text style={styles.value}>{property.address || "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>PLZ / Ort</Text>
            <Text style={styles.value}>
              {(property.zip ? property.zip : "—") +
                " / " +
                (property.city ? property.city : "—")}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gebäudetyp</Text>
            <Text style={styles.value}>{property.building_type || "—"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Versicherungs-Split</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Split</Text>
            <Text style={styles.value}>
              {report.insurance_split ? splitLabel(report.insurance_split) : "—"}
            </Text>
          </View>
          <Text style={styles.footerNote}>
            Hinweis: Darstellung erfolgt token-basiert entsprechend der internen Split-Logik.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rechnungen</Text>
          {invoices.length === 0 ? (
            <Text style={styles.small}>Keine Rechnungen vorhanden.</Text>
          ) : (
            invoices.map((inv, idx) => (
              <View key={`${inv.status}-${idx}`} style={styles.listItem}>
                <View style={styles.row}>
                  <Text style={styles.label}>Betrag</Text>
                  <Text style={styles.value}>{formatEUR(inv.amount)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Status</Text>
                  <Text style={styles.value}>{invoiceStatusDe(inv.status)}</Text>
                </View>
                <Text style={styles.small}>Datum: {formatDate(inv.created_at)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aktivität (Auszug)</Text>
          {activityFeed.length === 0 ? (
            <Text style={styles.small}>Keine Aktivitäten vorhanden.</Text>
          ) : (
            activityFeed.slice(0, 8).map((a, idx) => (
              <View key={`${a.action}-${idx}`} style={styles.listItem}>
                <Text style={{ fontWeight: 700, fontSize: 9 }}>{a.action}</Text>
                <Text style={styles.small}>{formatDate(a.created_at)}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.footer}>
          Automatisch erzeugt · Kein Ersatz für ein unabhängiges Vollgutachten · Hydra Guard
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>Hydra Guard</Text>
          <Text style={styles.title}>Fotodokumentation</Text>
          <Text style={styles.subtitle}>
            {photos.length} Foto{photos.length === 1 ? "" : "s"} · Schaden-ID:{" "}
            {report.id}
          </Text>
        </View>

        {photos.length === 0 ? (
          <View style={styles.section}>
            <Text style={styles.small}>Keine Fotos vorhanden.</Text>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {photos.map((p, idx) => (
              <View key={p.id} style={styles.photoCard} wrap={false}>
                {p.imageSrc ? (
                  // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
                  <Image src={p.imageSrc} style={styles.photoImg} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={{ fontSize: 8, color: "#9CA3AF" }}>
                      Bild nicht verfügbar
                    </Text>
                  </View>
                )}
                <Text style={styles.photoCaption}>
                  {idx + 1}. {p.room_label || p.original_name || "Foto"}
                  {p.insurance_scope ? ` (${splitLabel(p.insurance_scope)})` : ""}
                </Text>
                <Text style={styles.photoMeta}>
                  {formatDateShort(p.uploaded_at)}
                  {p.analysis
                    ? ` · Schwere: ${severityDe(p.analysis.severity)} · ca. ${formatEUR(p.analysis.suggested_amount_eur)}`
                    : ""}
                </Text>
                {p.analysis?.summary_de ? (
                  <Text style={styles.photoMeta}>{p.analysis.summary_de}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>
          Fotos aus der Schadenmeldung · DSGVO: nur für Anspruchsbearbeitung · Hydra Guard
        </Text>
      </Page>
    </Document>
  );
}
