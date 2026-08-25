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
import { Building, Calendar1, Clock, DocumentText } from "iconsax-react-native";
import { WebView } from "react-native-webview";
import { HeaderTitle } from "../../components/HeaderTitle";
import { TapImagePreview } from "../../components/TapImagePreview";
import { SCREEN_GUTTER } from "../../theme/layout";
import {
  getMyPermissionRequest,
  PERMISSION_CATEGORY_OPTIONS,
  permissionStatusLabel,
  type PermissionCategory,
  type PermissionRequestDto,
  type PermissionRequestFileDto,
} from "../../services/workforcePermissionRequestService";
import { formatWorkforceYmd } from "../../utils/formatWorkforceYmd";

const COLORS = {
  surface: "#FFFFFF",
  ink: "#1C1C1E",
  muted: "#8E8E93",
  field: "#F3F1EC",
  accent: "#EA7600",
  pendingBg: "rgba(234, 118, 0, 0.14)",
  pendingText: "#EA7600",
  approvedBg: "rgba(22, 163, 74, 0.16)",
  approvedText: "#16A34A",
  rejectedBg: "#FFF1F2",
  rejectedText: "#BE123C",
};

function categoryLabel(category: PermissionCategory) {
  return PERMISSION_CATEGORY_OPTIONS.find((o) => o.value === category)?.label ?? category;
}

function statusLabel(status: PermissionRequestDto["status"]) {
  return permissionStatusLabel(status);
}

function statusStyle(status: PermissionRequestDto["status"]) {
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

function evidenceImageUri(file: PermissionRequestFileDto["file"]) {
  return file.thumbnailUrl || file.url || null;
}

export default function PermisoDetalleScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const requestId = route.params?.requestId as string | undefined;

  const [item, setItem] = useState<PermissionRequestDto | null>(null);
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
      const data = await getMyPermissionRequest(requestId);
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
    <View style={styles.root}>
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <HeaderTitle
        title="Detalle del permiso"
        subtitle={item ? permissionStatusLabel(item.status) : undefined}
        tone="light"
        style={styles.header}
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
      />
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
            paddingHorizontal: SCREEN_GUTTER,
            paddingTop: 12,
            paddingBottom: Math.max(tabBarHeight, insets.bottom) + 36,
          }}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroIcon}>
                <Calendar1 size={22} color={COLORS.accent} variant="Linear" />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.heroDate}>
                  {formatWorkforceYmd(item.permissionDate)}
                </Text>
                <Text style={styles.heroSub}>{categoryLabel(item.category)}</Text>
              </View>
              {badge ? (
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>
                    {statusLabel(item.status)}
                  </Text>
                </View>
              ) : null}
            </View>
            {item.status === "PENDING" ||
            item.status === "PENDING_RH" ||
            item.status === "PENDING_SUPERVISOR" ? (
              <Text style={styles.pendingNote}>
                {item.status === "PENDING_SUPERVISOR"
                  ? "Tu solicitud está con el jefe inmediato."
                  : "Tu solicitud está en preautorización de RH."}
              </Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.bodyText}>{item.description}</Text>
          </View>

          {item.pendingWorkNotes ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cobertura y pendientes</Text>
              <Text style={styles.bodyText}>{item.pendingWorkNotes}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Building size={16} color={COLORS.muted} variant="Linear" />
              </View>
              <Text style={styles.infoLabel}>Almacén</Text>
              <Text style={styles.infoValue}>{item.warehouse.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Clock size={16} color={COLORS.muted} variant="Linear" />
              </View>
              <Text style={styles.infoLabel}>Enviada</Text>
              <Text style={styles.infoValue}>{formatDateTime(item.createdAt)}</Text>
            </View>
            {item.reviewedAt ? (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Calendar1 size={16} color={COLORS.muted} variant="Linear" />
                </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: { paddingHorizontal: SCREEN_GUTTER },
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
    borderRadius: 22,
    backgroundColor: COLORS.field,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { flex: 1 },
  heroDate: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.ink,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.muted,
    marginTop: 2,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
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
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.ink,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
    color: COLORS.ink,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.field,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.muted,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.ink,
    textAlign: "right",
  },
  reviewBox: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: COLORS.field,
    padding: 12,
  },
  reviewLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: COLORS.ink,
  },
  muted: {
    fontSize: 13,
    color: COLORS.muted,
  },
  evidenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  imageCard: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.field,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  pdfCard: {
    width: "47%",
    minHeight: 140,
    borderRadius: 16,
    backgroundColor: COLORS.field,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  pdfName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.ink,
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
    borderRadius: 16,
    backgroundColor: COLORS.field,
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
  },
  pdfBarTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.ink,
    marginRight: 12,
  },
  pdfClose: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.accent,
  },
});
