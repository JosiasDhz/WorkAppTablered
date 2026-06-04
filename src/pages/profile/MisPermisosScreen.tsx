import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Add, ArrowRight2, Calendar1 } from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import {
  listMyPermissionRequests,
  type PermissionRequestDto,
} from "../../services/workforcePermissionRequestService";
import { formatWorkforceYmd } from "../../utils/formatWorkforceYmd";

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

function statusLabel(status: PermissionRequestDto["status"]) {
  if (status === "APPROVED") return "Aprobado";
  if (status === "REJECTED") return "Rechazado";
  return "Pendiente";
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

export default function MisPermisosScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();
  const [items, setItems] = useState<PermissionRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const now = new Date();
      const list = await listMyPermissionRequests({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      });
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <HeaderTitle title="Mis permisos" onBack={() => navigation.goBack()} />
      <ScrollView
        onScroll={onAutoTabBarScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(tabBarHeight, insets.bottom) + 24,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        <Pressable
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          onPress={() => navigation.navigate("NuevoPermiso")}
        >
          <Add size={22} color="#FFFFFF" variant="Linear" />
          <Text style={styles.actionBtnText}>Solicitar permiso</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 32 }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Calendar1 size={40} color={COLORS.muted} variant="Linear" />
            <Text style={styles.emptyTitle}>Sin solicitudes</Text>
            <Text style={styles.emptyText}>
              Cuando solicites un permiso aparecerá aquí con su estado.
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const badge = statusStyle(item.status);
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
                onPress={() =>
                  navigation.navigate("PermisoDetalle", { requestId: item.id })
                }
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>
                    {formatWorkforceYmd(item.permissionDate)}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>
                      {statusLabel(item.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardMeta}>
                    {item.files.length} evidencia{item.files.length === 1 ? "" : "s"}
                  </Text>
                  <View style={styles.cardLink}>
                    <Text style={styles.cardLinkText}>Ver detalle</Text>
                    <ArrowRight2 size={14} color={COLORS.accent} variant="Linear" />
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  empty: {
    alignItems: "center",
    marginTop: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.92,
    borderColor: COLORS.accent,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
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
  cardDesc: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  cardFooter: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardMeta: {
    fontSize: 12,
    color: COLORS.muted,
  },
  cardLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accent,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  actionBtnPressed: { opacity: 0.92 },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
