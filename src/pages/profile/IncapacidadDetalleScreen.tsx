import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Calendar1, DocumentText } from "iconsax-react-native";
import { WebView } from "react-native-webview";
import { HeaderTitle } from "../../components/HeaderTitle";
import { TapImagePreview } from "../../components/TapImagePreview";
import {
  getMyIncapacityRequest,
  type IncapacityRequestDto,
  type IncapacityRequestFileDto,
} from "../../services/workforceIncapacityRequestService";
import { formatWorkforceYmdRange } from "../../utils/formatWorkforceYmd";

const COLORS = {
  bg: "#F7F7F6",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  border: "#E5E7EB",
  accent: "#EA7600",
  pendingBg: "#FFF4EB",
  pendingText: "#EA7600",
  approvedBg: "#ECFDF3",
  approvedText: "#16A34A",
  rejectedBg: "#FEF2F2",
  rejectedText: "#DC2626",
};

function statusLabel(status: IncapacityRequestDto["status"]) {
  if (status === "APPROVED") return "Aprobado";
  if (status === "REJECTED") return "Rechazado";
  return "Pendiente";
}

function statusStyle(status: IncapacityRequestDto["status"]) {
  if (status === "APPROVED") {
    return { bg: COLORS.approvedBg, text: COLORS.approvedText };
  }
  if (status === "REJECTED") {
    return { bg: COLORS.rejectedBg, text: COLORS.rejectedText };
  }
  return { bg: COLORS.pendingBg, text: COLORS.pendingText };
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPdf(mimetype: string) {
  return mimetype.toLowerCase().includes("pdf");
}

function evidenceImageUri(file: IncapacityRequestFileDto["file"]) {
  return file.thumbnailUrl || file.url || null;
}

export default function IncapacidadDetalleScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const requestId = route.params?.requestId as string | undefined;

  const [item, setItem] = useState<IncapacityRequestDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");

  const load = useCallback(async () => {
    if (!requestId) {
      setItem(null);
      setLoading(false);
      return;
    }
    try {
      const data = await getMyIncapacityRequest(requestId);
      setItem(data);
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void load();
  }, [load]);

  const badge = item ? statusStyle(item.status) : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <HeaderTitle title="Detalle de incapacidad" onBack={() => navigation.goBack()} />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : !item ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>No se pudo cargar la solicitud.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(tabBarHeight, insets.bottom) + 24,
          }}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroIcon}>
                <Calendar1 size={22} color={COLORS.accent} variant="Linear" />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.heroDate}>
                  {formatWorkforceYmdRange(item.startDate, item.endDate)}
                </Text>
                <Text style={styles.heroSub}>
                  {item.dayCount} día(s) solicitados
                </Text>
              </View>
              {badge ? (
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>
                    {statusLabel(item.status)}
                  </Text>
                </View>
              ) : null}
            </View>
            {item.status === "PENDING" ? (
              <Text style={styles.pendingNote}>
                Tu solicitud está en revisión.
              </Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Motivo</Text>
            <Text style={styles.bodyText}>{item.reason.name}</Text>
            <Text style={styles.muted}>
              Máx. {item.reason.maxDays} día(s)
              {item.reason.requiresEvidence ? " · Requiere evidencia" : ""}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Almacén</Text>
              <Text style={styles.infoValue}>{item.warehouse.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Enviada</Text>
              <Text style={styles.infoValue}>{formatDateTime(item.createdAt)}</Text>
            </View>
            {item.reviewedAt ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Revisada</Text>
                <Text style={styles.infoValue}>{formatDateTime(item.reviewedAt)}</Text>
              </View>
            ) : null}
            {item.reviewReason ? (
              <View style={styles.reviewBox}>
                <Text style={styles.reviewLabel}>Comentario de revisión</Text>
                <Text style={styles.reviewText}>{item.reviewReason}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Evidencias ({item.files.length})
            </Text>
            {item.files.length === 0 ? (
              <Text style={styles.muted}>Sin archivos adjuntos.</Text>
            ) : (
              <View style={styles.evidenceGrid}>
                {item.files.map((entry) => {
                  const file = entry.file;
                  const uri = evidenceImageUri(file);
                  const pdf = isPdf(file.mimetype);

                  if (pdf && file.url) {
                    return (
                      <Pressable
                        key={entry.id}
                        style={styles.pdfCard}
                        onPress={() => {
                          setPdfTitle(`${file.name}.${file.extension}`);
                          setPdfUri(file.url!);
                        }}
                      >
                        <DocumentText size={28} color={COLORS.accent} variant="Linear" />
                        <Text style={styles.pdfName} numberOfLines={2}>
                          {file.name}.{file.extension}
                        </Text>
                        <Text style={styles.pdfAction}>Ver PDF</Text>
                      </Pressable>
                    );
                  }

                  if (uri) {
                    return (
                      <View key={entry.id} style={styles.imageCard}>
                        <TapImagePreview uri={uri}>
                          <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                        </TapImagePreview>
                      </View>
                    );
                  }

                  return (
                    <View key={entry.id} style={styles.unavailableCard}>
                      <Text style={styles.muted}>Archivo no disponible</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={Boolean(pdfUri)}
        animationType="slide"
        onRequestClose={() => setPdfUri(null)}
      >
        <View style={[styles.pdfModal, { paddingBottom: insets.bottom }]}>
          <View style={[styles.pdfBar, { paddingTop: insets.top + 8 }]}>
            <Text style={styles.pdfBarTitle} numberOfLines={1}>
              {pdfTitle}
            </Text>
            <TouchableOpacity onPress={() => setPdfUri(null)}>
              <Text style={styles.pdfClose}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          {pdfUri ? (
            <WebView
              originWhitelist={["*"]}
              source={{ uri: pdfUri }}
              style={{ flex: 1 }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
              )}
            />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: "center",
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFF4EB",
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { flex: 1 },
  heroDate: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  heroSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  pendingNote: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.pendingText,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.muted,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "right",
  },
  reviewBox: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    padding: 12,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: 4,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },
  muted: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 6,
  },
  evidenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  imageCard: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  pdfCard: {
    width: "47%",
    minHeight: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFFBF5",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  pdfName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  pdfAction: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accent,
  },
  unavailableCard: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfModal: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  pdfBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pdfBarTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginRight: 12,
  },
  pdfClose: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.accent,
  },
});
