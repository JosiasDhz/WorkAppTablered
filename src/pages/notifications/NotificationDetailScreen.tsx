import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SoftPressable, SoftReveal } from "../../components/SoftPressable";
import { SCREEN_GUTTER } from "../../theme/layout";
import {
  getInAppNotification,
  markInAppNotificationRead,
  type InAppNotificationRow,
} from "../../services/inAppNotificationService";
import {
  authorizeLateEntry,
  rejectLateEntry,
} from "../../services/lateEntryAuthorizationService";
import { refreshInAppUnreadCount } from "../../services/inAppUnreadBadge";
import type { NotificationsStackParamList } from "../../routes/navigators/NotificationsStackParamList";
import { resolveNotificationAppearance } from "./notificationAppearance";
import {
  NOTIFICATION_RADIUS,
  useNotificationColors,
} from "./notificationsTheme";

const LATE_ENTRY_PENDING = "LATE_ENTRY_AUTHORIZATION_PENDING";

function formatDetailDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readLateEntryPayload(payload: Record<string, unknown>) {
  const sellerId =
    typeof payload.sellerId === "string" ? payload.sellerId.trim() : "";
  const workDayYmd =
    typeof payload.workDayYmd === "string" ? payload.workDayYmd.trim() : "";
  return {
    sellerId,
    workDayYmd: /^\d{4}-\d{2}-\d{2}$/.test(workDayYmd) ? workDayYmd : undefined,
  };
}

function apiErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const data = error as Record<string, unknown>;
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (Array.isArray(data.message) && data.message.length > 0) {
      return String(data.message[0]);
    }
  }
  return "No se pudo completar la acción.";
}

export default function NotificationDetailScreen() {
  const navigation = useNavigation<any>();
  const route =
    useRoute<RouteProp<NotificationsStackParamList, "NotificationDetail">>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const colors = useNotificationColors();
  const notificationId = route.params?.notificationId;
  const previewTitle = route.params?.title;
  const previewBody = route.params?.body;
  const previewType = route.params?.type;

  const [row, setRow] = useState<InAppNotificationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);
  const [resolved, setResolved] = useState(false);

  const load = useCallback(async () => {
    if (!notificationId) {
      setMissing(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getInAppNotification(notificationId);
      setRow(data);
      setMissing(false);
      if (!data.readAt) {
        void markInAppNotificationRead(notificationId)
          .then(() => refreshInAppUnreadCount())
          .catch(() => undefined);
        setRow((current) =>
          current
            ? { ...current, readAt: current.readAt ?? new Date().toISOString() }
            : current,
        );
      }
    } catch {
      setMissing(true);
    } finally {
      setLoading(false);
    }
  }, [notificationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const title = row?.title || previewTitle || "Aviso";
  const body = row?.body || previewBody || "";
  const type = row?.type || previewType || "";
  const { Icon, tint, wash } = resolveNotificationAppearance(type);
  const whenLabel = formatDetailDate(row?.createdAt ?? "");
  const lateEntry = readLateEntryPayload(row?.payload ?? {});
  const canReviewLateEntry =
    type === LATE_ENTRY_PENDING && Boolean(lateEntry.sellerId) && !resolved;

  const runLateEntryAction = async (action: "approve" | "reject") => {
    if (!lateEntry.sellerId || acting) return;
    setActing(action);
    try {
      if (action === "approve") {
        await authorizeLateEntry({
          sellerId: lateEntry.sellerId,
          workDayYmd: lateEntry.workDayYmd,
        });
        Toast.show({
          type: "success",
          text1: "Entrada autorizada",
          text2: "El colaborador ya puede continuar su jornada.",
        });
      } else {
        await rejectLateEntry({
          sellerId: lateEntry.sellerId,
          workDayYmd: lateEntry.workDayYmd,
        });
        Toast.show({
          type: "success",
          text1: "Entrada rechazada",
          text2: "Se avisó al colaborador.",
        });
      }
      setResolved(true);
      void refreshInAppUnreadCount();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "No se pudo completar",
        text2: apiErrorMessage(error),
      });
    } finally {
      setActing(null);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <HeaderTitle
        title="Detalle"
        subtitle="Aviso"
        tone="light"
        style={styles.header}
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(tabBarHeight, insets.bottom) + 36 },
        ]}
      >
        {loading && !row && !previewTitle ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : missing && !previewTitle ? (
          <View style={styles.loadingBox}>
            <Text style={[styles.missingText, { color: colors.muted }]}>
              No se pudo cargar este aviso.
            </Text>
          </View>
        ) : (
          <SoftReveal delay={0}>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={[styles.well, { backgroundColor: wash }]}>
                <Icon size={28} color={tint} variant="Linear" />
              </View>
              <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
              {whenLabel ? (
                <Text style={[styles.when, { color: colors.muted }]}>
                  {whenLabel}
                </Text>
              ) : null}
              {body ? (
                <Text style={[styles.body, { color: colors.ink }]}>{body}</Text>
              ) : null}
              {canReviewLateEntry ? (
                <View style={styles.actions}>
                  <SoftPressable
                    onPress={() => void runLateEntryAction("reject")}
                    disabled={Boolean(acting)}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.roseSoft },
                    ]}
                    accessibilityLabel="Rechazar entrada"
                  >
                    {acting === "reject" ? (
                      <ActivityIndicator color={colors.rose} />
                    ) : (
                      <Text style={[styles.rejectLabel, { color: colors.rose }]}>
                        Rechazar
                      </Text>
                    )}
                  </SoftPressable>
                  <SoftPressable
                    onPress={() => void runLateEntryAction("approve")}
                    disabled={Boolean(acting)}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.accent },
                    ]}
                    accessibilityLabel="Autorizar entrada"
                  >
                    {acting === "approve" ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.approveLabel}>Autorizar</Text>
                    )}
                  </SoftPressable>
                </View>
              ) : null}
              {resolved ? (
                <Text style={[styles.resolvedLabel, { color: colors.emerald }]}>
                  Decisión registrada. El colaborador ya fue notificado.
                </Text>
              ) : null}
            </View>
          </SoftReveal>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SCREEN_GUTTER,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 8,
  },
  loadingBox: {
    marginTop: 48,
    alignItems: "center",
  },
  missingText: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  card: {
    borderRadius: NOTIFICATION_RADIUS.section,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  well: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  when: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    textTransform: "capitalize",
  },
  body: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    textAlign: "center",
    alignSelf: "stretch",
  },
  actions: {
    marginTop: 24,
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  rejectLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  approveLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  resolvedLabel: {
    marginTop: 18,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
