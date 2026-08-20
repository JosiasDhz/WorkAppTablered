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
import { HeaderTitle } from "../../components/HeaderTitle";
import { SoftReveal } from "../../components/SoftPressable";
import { SCREEN_GUTTER } from "../../theme/layout";
import {
  getInAppNotification,
  markInAppNotificationRead,
  type InAppNotificationRow,
} from "../../services/inAppNotificationService";
import { refreshInAppUnreadCount } from "../../services/inAppUnreadBadge";
import type { NotificationsStackParamList } from "../../routes/navigators/NotificationsStackParamList";
import { resolveNotificationAppearance } from "./notificationAppearance";
import { NOTIFICATION_COLORS, NOTIFICATION_RADIUS } from "./notificationsTheme";

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

export default function NotificationDetailScreen() {
  const navigation = useNavigation<any>();
  const route =
    useRoute<RouteProp<NotificationsStackParamList, "NotificationDetail">>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const notificationId = route.params?.notificationId;
  const previewTitle = route.params?.title;
  const previewBody = route.params?.body;
  const previewType = route.params?.type;

  const [row, setRow] = useState<InAppNotificationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

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
            <ActivityIndicator color={NOTIFICATION_COLORS.accent} />
          </View>
        ) : missing && !previewTitle ? (
          <View style={styles.loadingBox}>
            <Text style={styles.missingText}>
              No se pudo cargar este aviso.
            </Text>
          </View>
        ) : (
          <SoftReveal delay={0}>
            <View style={styles.card}>
              <View style={[styles.well, { backgroundColor: wash }]}>
                <Icon size={28} color={tint} variant="Linear" />
              </View>
              <Text style={styles.title}>{title}</Text>
              {whenLabel ? <Text style={styles.when}>{whenLabel}</Text> : null}
              {body ? <Text style={styles.body}>{body}</Text> : null}
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
    color: NOTIFICATION_COLORS.muted,
    textAlign: "center",
  },
  card: {
    backgroundColor: NOTIFICATION_COLORS.surface,
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
    color: NOTIFICATION_COLORS.ink,
    textAlign: "center",
  },
  when: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "500",
    color: NOTIFICATION_COLORS.muted,
    textAlign: "center",
    textTransform: "capitalize",
  },
  body: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    color: NOTIFICATION_COLORS.ink,
    textAlign: "center",
    alignSelf: "stretch",
  },
});
