import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type SaniererReportData = {
  report: {
    id: string;
    reported_cause: string | null;
    created_at: string;
  };
  property: {
    address: string;
    city: string | null;
    zip: string | null;
  };
  photos: Array<{
    original_name: string | null;
    uploaded_at: string;
  }>;
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE");
}

const COLORS = {
  red: "#DC2626",
  redBg: "#FEF2F2",
  yellow: "#D97706",
  yellowBg: "#FFFBEB",
  green: "#16A34A",
  greenBg: "#F0FDF4",
} as const;

export function SaniererReportDocument({
  data,
}: {
  data: SaniererReportData;
}) {
  const s = StyleSheet.create({
    page: {
      padding: 28,
      fontSize: 10,
      fontFamily: "Helvetica",
      lineHeight: 1.4,
    },
    header: {
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
      marginBottom: 16,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    title: { fontSize: 16, fontWeight: 700, color: "#111827" },
    subtitle: { marginTop: 4, fontSize: 10, color: "#374151" },
    section: {
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 6,
      padding: 12,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 700,
      color: "#111827",
      marginBottom: 8,
    },
    accentBar: {
      width: 4,
      borderRadius: 2,
      marginRight: 10,
    },
    accentSection: {
      flexDirection: "row",
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 6,
      overflow: "hidden",
    },
    accentBody: {
      flex: 1,
      padding: 12,
    },
    checkRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    checkbox: {
      width: 10,
      height: 10,
      borderWidth: 1,
      borderColor: "#9CA3AF",
      borderRadius: 2,
      marginRight: 8,
    },
    checkLabel: { fontSize: 10, color: "#111827" },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    label: { color: "#6B7280", fontWeight: 600 },
    value: { color: "#111827", textAlign: "right", flexShrink: 1 },
    listItem: {
      paddingTop: 5,
      borderTopWidth: 1,
      borderTopColor: "#F3F4F6",
      marginBottom: 4,
    },
    small: { fontSize: 9, color: "#374151" },
  });

  const { report, property, photos } = data;
  const address = [property.address, property.zip, property.city]
    .filter(Boolean)
    .join(", ");

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* 1) Header */}
        <View style={s.header}>
          <View style={s.titleRow}>
            <View>
              <Text style={s.title}>Hydra Guard — Sanierer-Bericht</Text>
              <Text style={s.subtitle}>Schaden-ID: {report.id}</Text>
              <Text style={s.subtitle}>{address || "—"}</Text>
            </View>
            <Text style={s.subtitle}>{formatDate(report.created_at)}</Text>
          </View>
        </View>

        {/* 2) Schadensübersicht */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Schadensübersicht</Text>
          <View style={s.row}>
            <Text style={s.label}>Gemeldete Ursache</Text>
            <Text style={s.value}>{report.reported_cause || "—"}</Text>
          </View>
        </View>

        {/* 3) Sofortmaßnahmen — red accent */}
        <View style={s.accentSection}>
          <View style={[s.accentBar, { backgroundColor: COLORS.red }]} />
          <View style={[s.accentBody, { backgroundColor: COLORS.redBg }]}>
            <Text style={[s.sectionTitle, { color: COLORS.red }]}>
              Sofortmaßnahmen
            </Text>
            {["Wasserhaupthahn absperren", "Betroffene Bereiche sichern", "Fotodokumentation erstellen"].map((item) => (
              <View key={item} style={s.checkRow}>
                <View style={s.checkbox} />
                <Text style={s.checkLabel}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4) Technische Maßnahmen 72h — yellow accent */}
        <View style={s.accentSection}>
          <View style={[s.accentBar, { backgroundColor: COLORS.yellow }]} />
          <View style={[s.accentBody, { backgroundColor: COLORS.yellowBg }]}>
            <Text style={[s.sectionTitle, { color: COLORS.yellow }]}>
              Technische Maßnahmen 72h
            </Text>
            {["Trocknungsgeräte aufstellen", "Feuchtemessung durchführen", "Trocknungsprotokoll starten"].map((item) => (
              <View key={item} style={s.checkRow}>
                <View style={s.checkbox} />
                <Text style={s.checkLabel}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 5) Abschluss — green accent */}
        <View style={s.accentSection}>
          <View style={[s.accentBar, { backgroundColor: COLORS.green }]} />
          <View style={[s.accentBody, { backgroundColor: COLORS.greenBg }]}>
            <Text style={[s.sectionTitle, { color: COLORS.green }]}>
              Abschluss
            </Text>
            {["Abnahme durch Eigentümer", "Protokoll unterschreiben", "Rechnung einreichen"].map((item) => (
              <View key={item} style={s.checkRow}>
                <View style={s.checkbox} />
                <Text style={s.checkLabel}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 6) Photo list (building scope only) */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Fotos (Gebäude)</Text>
          {photos.length === 0 ? (
            <Text style={s.small}>Keine Gebäude-Fotos vorhanden.</Text>
          ) : (
            photos.map((p, idx) => (
              <View key={`photo-${idx}`} style={s.listItem}>
                <Text style={{ fontWeight: 700, fontSize: 10 }}>
                  {idx + 1}. {p.original_name || "Foto"}
                </Text>
                <Text style={s.small}>
                  Hochgeladen: {formatDate(p.uploaded_at)}
                </Text>
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}
