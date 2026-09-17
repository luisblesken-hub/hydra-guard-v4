import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PdfPhotoImage } from "@/lib/pdf/load-photo-images";

export type SaniererReportData = {
  report: {
    id: string;
    reported_cause: string | null;
    confirmed_cause: string | null;
    description: string | null;
    estimated_amount: number | null;
    claim_tier: string | null;
    status: string | null;
    created_at: string;
  };
  property: {
    address: string;
    city: string | null;
    zip: string | null;
  };
  photos: PdfPhotoImage[];
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE");
}

function formatEUR(amount: number | null) {
  if (amount == null || !Number.isFinite(amount)) return "—";
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

const COLORS = {
  red: "#DC2626",
  redBg: "#FEF2F2",
  yellow: "#D97706",
  yellowBg: "#FFFBEB",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  blue: "#1D4ED8",
  blueBg: "#EFF6FF",
} as const;

const s = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  header: {
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.blue,
    marginBottom: 14,
  },
  brand: { fontSize: 11, color: COLORS.blue, fontWeight: 700, marginBottom: 2 },
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
  accentBar: { width: 4, borderRadius: 2, marginRight: 10 },
  accentSection: {
    flexDirection: "row",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
  },
  accentBody: { flex: 1, padding: 10 },
  checkRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: "#9CA3AF",
    borderRadius: 2,
    marginRight: 7,
  },
  checkLabel: { fontSize: 9, color: "#111827" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  label: { color: "#6B7280", fontWeight: 600, fontSize: 9 },
  value: { color: "#111827", textAlign: "right", flexShrink: 1, fontSize: 9 },
  body: { fontSize: 9, color: "#374151", marginTop: 4 },
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

export function SaniererReportDocument({
  data,
}: {
  data: SaniererReportData;
}) {
  const { report, property, photos } = data;
  const address = [property.address, property.zip, property.city]
    .filter(Boolean)
    .join(", ");
  const cause = report.confirmed_cause || report.reported_cause || "—";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>Hydra Guard</Text>
          <Text style={s.title}>Kleines Schadensgutachten</Text>
          <Text style={s.subtitle}>Sanierer-Unterlage · Schaden-ID: {report.id}</Text>
          <Text style={s.subtitle}>{address || "—"} · {formatDate(report.created_at)}</Text>
        </View>

        <View style={[s.section, { backgroundColor: COLORS.blueBg }]}>
          <Text style={s.sectionTitle}>Kurzfazit</Text>
          <View style={s.row}>
            <Text style={s.label}>Ursache</Text>
            <Text style={s.value}>{cause}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Schätzwert</Text>
            <Text style={s.value}>{formatEUR(report.estimated_amount)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Track</Text>
            <Text style={s.value}>{tierLabel(report.claim_tier)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Status</Text>
            <Text style={s.value}>{report.status || "—"}</Text>
          </View>
          {report.description ? (
            <Text style={s.body}>{report.description}</Text>
          ) : null}
        </View>

        <View style={s.accentSection}>
          <View style={[s.accentBar, { backgroundColor: COLORS.red }]} />
          <View style={[s.accentBody, { backgroundColor: COLORS.redBg }]}>
            <Text style={[s.sectionTitle, { color: COLORS.red }]}>Sofortmaßnahmen</Text>
            {["Wasserhaupthahn absperren", "Betroffene Bereiche sichern", "Fotodokumentation prüfen"].map(
              (item) => (
                <View key={item} style={s.checkRow}>
                  <View style={s.checkbox} />
                  <Text style={s.checkLabel}>{item}</Text>
                </View>
              )
            )}
          </View>
        </View>

        <View style={s.accentSection}>
          <View style={[s.accentBar, { backgroundColor: COLORS.yellow }]} />
          <View style={[s.accentBody, { backgroundColor: COLORS.yellowBg }]}>
            <Text style={[s.sectionTitle, { color: COLORS.yellow }]}>
              Technische Maßnahmen 72h
            </Text>
            {["Trocknungsgeräte aufstellen", "Feuchtemessung durchführen", "Trocknungsprotokoll starten"].map(
              (item) => (
                <View key={item} style={s.checkRow}>
                  <View style={s.checkbox} />
                  <Text style={s.checkLabel}>{item}</Text>
                </View>
              )
            )}
          </View>
        </View>

        <View style={s.accentSection}>
          <View style={[s.accentBar, { backgroundColor: COLORS.green }]} />
          <View style={[s.accentBody, { backgroundColor: COLORS.greenBg }]}>
            <Text style={[s.sectionTitle, { color: COLORS.green }]}>Abschluss</Text>
            {["Abnahme durch Eigentümer", "Protokoll unterschreiben", "Rechnung einreichen"].map(
              (item) => (
                <View key={item} style={s.checkRow}>
                  <View style={s.checkbox} />
                  <Text style={s.checkLabel}>{item}</Text>
                </View>
              )
            )}
          </View>
        </View>

        <Text style={s.footer}>
          Automatisch erzeugt · Kein Ersatz für ein unabhängiges Vollgutachten · Hydra Guard
        </Text>
      </Page>

      {/* Photo documentation page(s) */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>Hydra Guard</Text>
          <Text style={s.title}>Fotodokumentation</Text>
          <Text style={s.subtitle}>
            {photos.length} Foto{photos.length === 1 ? "" : "s"} · Schaden-ID: {report.id}
          </Text>
        </View>

        {photos.length === 0 ? (
          <View style={s.section}>
            <Text style={s.body}>Keine Fotos vorhanden.</Text>
          </View>
        ) : (
          <View style={s.photoGrid}>
            {photos.map((p, idx) => (
              <View key={p.id} style={s.photoCard} wrap={false}>
                {p.imageSrc ? (
                  // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
                  <Image src={p.imageSrc} style={s.photoImg} />
                ) : (
                  <View style={s.photoPlaceholder}>
                    <Text style={{ fontSize: 8, color: "#9CA3AF" }}>Bild nicht verfügbar</Text>
                  </View>
                )}
                <Text style={s.photoCaption}>
                  {idx + 1}. {p.room_label || p.original_name || "Foto"}
                </Text>
                <Text style={s.photoMeta}>
                  {formatDate(p.uploaded_at)}
                  {p.analysis
                    ? ` · Schwere: ${severityDe(p.analysis.severity)} · ${p.analysis.damage_type}`
                    : ""}
                </Text>
                {p.analysis?.summary_de ? (
                  <Text style={s.photoMeta}>{p.analysis.summary_de}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <Text style={s.footer}>
          Fotos aus der Schadenmeldung · DSGVO: nur für Anspruchsbearbeitung · Hydra Guard
        </Text>
      </Page>
    </Document>
  );
}
