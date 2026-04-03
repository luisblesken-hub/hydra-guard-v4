import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

type VersichererReportData = {
  report: {
    id: string;
    status: string;
    damage_amount_estimate: number;
    insurance_split: string | null;
    reported_cause: string | null;
    confirmed_cause: string | null;
    created_at: string;
  };
  property: {
    address: string;
    city: string | null;
    zip: string | null;
    building_type: string | null;
  };
  photos: Array<{
    original_name: string | null;
    room_label: string | null;
    insurance_scope: string | null;
    uploaded_at: string;
  }>;
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

function formatEUR(amount: number) {
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function VersichererReportDocument({
  data,
}: {
  data: VersichererReportData;
}) {
  const styles = StyleSheet.create({
    page: {
      padding: 28,
      fontSize: 10,
      fontFamily: "Helvetica",
      lineHeight: 1.4,
    },
    header: {
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
      marginBottom: 16,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: 700,
      color: "#111827",
    },
    subtitle: {
      marginTop: 4,
      fontSize: 10,
      color: "#374151",
    },
    section: {
      marginBottom: 14,
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
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 4,
    },
    label: {
      color: "#6B7280",
      fontWeight: 600,
    },
    value: {
      color: "#111827",
      textAlign: "right",
      flexShrink: 1,
    },
    list: {
      marginTop: 6,
      gap: 6,
    },
    listItem: {
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: "#F3F4F6",
    },
    small: {
      fontSize: 9,
      color: "#374151",
    },
    footerNote: {
      marginTop: 10,
      color: "#6B7280",
      fontSize: 8,
    },
  })

  const { report, property, photos, activityFeed, invoices } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.title}>Hydra Guard</Text>
              <Text style={styles.subtitle}>
                Versicherer-Export · Schaden-ID: {report.id}
              </Text>
            </View>
            <View>
              <Text style={styles.subtitle}>Erstellt: {formatDate(report.created_at)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schadensübersicht</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{report.status}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Schätzwert</Text>
            <Text style={styles.value}>{formatEUR(report.damage_amount_estimate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gemeldete Ursache</Text>
            <Text style={styles.value}>
              {report.reported_cause ? report.reported_cause : "—"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Bestätigte Ursache</Text>
            <Text style={styles.value}>
              {report.confirmed_cause ? report.confirmed_cause : "—"}
            </Text>
          </View>
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
              {report.insurance_split ? report.insurance_split : "—"}
            </Text>
          </View>
          <Text style={styles.footerNote}>
            Hinweis: Darstellung erfolgt token-basiert entsprechend der internen Split-Logik.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fotos-Liste</Text>
          <View style={styles.list}>
            {photos.length === 0 ? (
              <Text style={styles.small}>Keine Fotos vorhanden.</Text>
            ) : (
              photos.map((p, idx) => (
                <View key={`${p.original_name ?? "photo"}-${idx}`} style={styles.listItem}>
                  <Text style={{ fontWeight: 700 }}>
                    {p.room_label ? p.room_label : "Foto"}
                  </Text>
                  <Text style={styles.small}>
                    Datei: {p.original_name ? p.original_name : "—"}
                  </Text>
                  <Text style={styles.small}>
                    Bereich: {p.insurance_scope ? p.insurance_scope : "—"}
                  </Text>
                  <Text style={styles.small}>Hochgeladen: {formatDate(p.uploaded_at)}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Feed</Text>
          <View style={styles.list}>
            {activityFeed.length === 0 ? (
              <Text style={styles.small}>Keine Aktivitäten vorhanden.</Text>
            ) : (
              activityFeed.map((a, idx) => (
                <View key={`${a.action}-${idx}`} style={styles.listItem}>
                  <Text style={{ fontWeight: 700 }}>{a.action}</Text>
                  <Text style={styles.small}>{formatDate(a.created_at)}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rechnungen</Text>
          <View style={styles.list}>
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
                    <Text style={styles.value}>{inv.status}</Text>
                  </View>
                  <Text style={styles.small}>Datum: {formatDate(inv.created_at)}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}

