import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import {
  Add,
  ArrowRight2,
  Calendar1,
  ClipboardTick,
  Heart,
  Hospital,
  User,
} from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { PageFlipReveal } from "../../components/PageFlipReveal";
import { SoftPressable } from "../../components/SoftPressable";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { SCREEN_GUTTER } from "../../theme/layout";
import {
  listMyPermissionRequests,
  PERMISSION_CATEGORY_OPTIONS,
  permissionStatusLabel,
  type PermissionCategory,
  type PermissionRequestDto,
} from "../../services/workforcePermissionRequestService";
import { formatWorkforceYmd } from "../../utils/formatWorkforceYmd";

const COLORS = {
  surface: "#FFFFFF",
  ink: "#1C1C1E",
  muted: "#8E8E93",
  divider: "rgba(60, 60, 67, 0.12)",
  accent: "#EA7600",
};

const ACCENT_SOFT = "rgba(234, 118, 0, 0.14)";
const DONE = "#16A34A";
const DONE_SOFT = "rgba(22, 163, 74, 0.16)";
const ROSE = "#BE123C";
const ROSE_SOFT = "#FFF1F2";
const FLIP_STAGGER_MS = 70;
const MAX_FLIP_DELAY_MS = 700;
const PENDING_STATUSES = new Set([
  "PENDING",
  "PENDING_RH",
  "PENDING_SUPERVISOR",
]);

function clampFlipDelay(delay: number) {
  return Math.min(delay, MAX_FLIP_DELAY_MS);
}

function categoryLabel(category: PermissionCategory) {
  return (
    PERMISSION_CATEGORY_OPTIONS.find((option) => option.value === category)
      ?.label ?? category
  );
}

function CategoryGlyph({ category }: { category: PermissionCategory }) {
  const props = { size: 20, color: COLORS.accent, variant: "Linear" as const };
  if (category === "SICKNESS") return <Hospital {...props} />;
  if (category === "BEREAVEMENT") return <Heart {...props} />;
  if (category === "PERSONAL") return <User {...props} />;
  if (category === "PERSONAL_ERRAND") return <ClipboardTick {...props} />;
  return <Calendar1 {...props} />;
}

function statusTone(status: PermissionRequestDto["status"]) {
  if (status === "APPROVED") {
    return { bg: DONE_SOFT, text: DONE };
  }
  if (status === "REJECTED") {
    return { bg: ROSE_SOFT, text: ROSE };
  }
  return { bg: ACCENT_SOFT, text: COLORS.accent };
}

function evidenceLabel(count: number) {
  if (count === 1) return "1 evidencia";
  return `${count} evidencias`;
}

function headerSubtitle(items: PermissionRequestDto[], loading: boolean) {
  if (loading) return "Cargando tus permisos";
  const pending = items.filter((item) => PENDING_STATUSES.has(item.status)).length;
  if (pending === 0) return "Estás al día con tus permisos";
  if (pending === 1) return "Tienes 1 permiso en revisión";
  return `Tienes ${pending} permisos en revisión`;
}

function PermisoCard({
  item,
  onPress,
}: {
  item: PermissionRequestDto;
  onPress: () => void;
}) {
  const tone = statusTone(item.status);
  return (
    <SoftPressable
      onPress={onPress}
      scaleTo={0.99}
      accessibilityLabel={`${categoryLabel(item.category)}. ${permissionStatusLabel(item.status)}`}
    >
      <View style={styles.card}>
        <View style={styles.iconWell}>
          <CategoryGlyph category={item.category} />
        </View>
        <View style={styles.cardCopy}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {categoryLabel(item.category)}
            </Text>
            <View style={[styles.badge, { backgroundColor: tone.bg }]}>
              <Text style={[styles.badgeText, { color: tone.text }]}>
                {permissionStatusLabel(item.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {formatWorkforceYmd(item.permissionDate)}
            {" · "}
            {evidenceLabel(item.files.length)}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <ArrowRight2 size={16} color={COLORS.muted} variant="Linear" />
      </View>
    </SoftPressable>
  );
}

export default function MisPermisosScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
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

  const pendingItems = useMemo(
    () => items.filter((item) => PENDING_STATUSES.has(item.status)),
    [items],
  );
  const resolvedItems = useMemo(
    () => items.filter((item) => !PENDING_STATUSES.has(item.status)),
    [items],
  );

  const openDetail = (requestId: string) => {
    navigation.navigate("PermisoDetalle", { requestId });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <HeaderTitle
          title="Mis permisos"
          subtitle={headerSubtitle(items, loading)}
          tone="light"
          style={styles.header}
          onBack={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          rightAccessory={
            <SoftPressable
              onPress={() => navigation.navigate("NuevoPermiso")}
              scaleTo={0.94}
              style={styles.addBtn}
              accessibilityLabel="Solicitar permiso"
            >
              <Add size={20} color={COLORS.accent} variant="Linear" />
            </SoftPressable>
          }
        />
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            onScroll={onAutoTabBarScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: SCREEN_GUTTER,
              paddingTop: 8,
              paddingBottom: Math.max(tabBarHeight, insets.bottom) + 36,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.ink}
              />
            }
          >
            {items.length === 0 ? (
              <PageFlipReveal delay={0} active={isFocused}>
                <View style={styles.empty}>
                  <View style={styles.emptyWell}>
                    <ClipboardTick size={28} color={COLORS.accent} variant="Linear" />
                  </View>
                  <Text style={styles.emptyTitle}>Sin solicitudes</Text>
                  <Text style={styles.emptyText}>
                    Cuando pidas un permiso, aparece aquí con su estado.
                  </Text>
                </View>
              </PageFlipReveal>
            ) : (
              <React.Fragment>
                {pendingItems.length > 0 ? (
                  <View style={styles.sectionBlock}>
                    <PageFlipReveal delay={0} active={isFocused}>
                      <Text style={styles.sectionTitle}>En revisión</Text>
                    </PageFlipReveal>
                    <View style={styles.list}>
                      {pendingItems.map((item, index) => (
                        <PageFlipReveal
                          key={item.id}
                          delay={clampFlipDelay((index + 1) * FLIP_STAGGER_MS)}
                          active={isFocused}
                        >
                          <PermisoCard
                            item={item}
                            onPress={() => openDetail(item.id)}
                          />
                        </PageFlipReveal>
                      ))}
                    </View>
                  </View>
                ) : null}
                {resolvedItems.length > 0 ? (
                  <View
                    style={
                      pendingItems.length > 0
                        ? styles.sectionBlockFollow
                        : styles.sectionBlock
                    }
                  >
                    <PageFlipReveal
                      delay={clampFlipDelay(
                        (pendingItems.length + 1) * FLIP_STAGGER_MS,
                      )}
                      active={isFocused}
                    >
                      <Text style={styles.sectionTitle}>Resueltos</Text>
                    </PageFlipReveal>
                    <View style={styles.list}>
                      {resolvedItems.map((item, index) => (
                        <PageFlipReveal
                          key={item.id}
                          delay={clampFlipDelay(
                            (pendingItems.length + index + 2) * FLIP_STAGGER_MS,
                          )}
                          active={isFocused}
                        >
                          <PermisoCard
                            item={item}
                            onPress={() => openDetail(item.id)}
                          />
                        </PageFlipReveal>
                      ))}
                    </View>
                  </View>
                ) : null}
              </React.Fragment>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SCREEN_GUTTER,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT_SOFT,
  },
  scroll: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sectionBlock: {
    width: "100%",
    marginTop: 8,
  },
  sectionBlockFollow: {
    width: "100%",
    marginTop: 22,
  },
  sectionTitle: {
    marginLeft: 4,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
  },
  list: {
    gap: 12,
  },
  card: {
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWell: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.ink,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardMeta: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
  },
  cardDesc: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: COLORS.muted,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 48,
    gap: 8,
  },
  emptyWell: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.ink,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
