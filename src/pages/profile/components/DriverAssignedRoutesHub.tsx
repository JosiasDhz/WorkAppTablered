import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useIsFocused,
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  ArrowRight2,
  Box1,
  CloseCircle,
  Routing2,
  TickCircle,
  Truck,
} from "iconsax-react-native";
import { HeaderTitle } from "../../../components/HeaderTitle";
import { PageFlipReveal } from "../../../components/PageFlipReveal";
import { SoftPressable } from "../../../components/SoftPressable";
import { navigateToDriverRouteDetail } from "../../../routes/navigateDriverRoutesFromProfileTab";
import { driverRouteConfirmationSummaryLabel } from "../../../domain/driverRouteConfirmation";
import { buildDriverRouteListCardModel } from "../../../domain/driverRouteListCardModel";
import { partitionDriverHubRoutes } from "../../../domain/driverRouteHubVisibility";
import type { DriverAssignedRouteRecord } from "../../../services/driverRoutesService";
import { SCREEN_GUTTER } from "../../../theme/layout";
import type { UseDriverPendingRoutesResult } from "../hooks/useDriverPendingRoutes";

const COLORS = {
  surface: "#FFFFFF",
  ink: "#1C1C1E",
  muted: "#8E8E93",
  accent: "#EA7600",
};

const ACCENT_SOFT = "rgba(234, 118, 0, 0.14)";
const DONE = "#16A34A";
const DONE_SOFT = "rgba(22, 163, 74, 0.16)";
const ROSE = "#BE123C";
const ROSE_SOFT = "#FFF1F2";
const WARN = "#B45309";
const WARN_SOFT = "rgba(245, 158, 11, 0.18)";
const FLIP_STAGGER_MS = 70;
const MAX_FLIP_DELAY_MS = 700;

type HubTab = "in-progress" | "pending" | "completed" | "cancelled";
type HubTabDef = { key: HubTab; label: string };
const HUB_TABS: HubTabDef[] = [
  { key: "in-progress", label: "En curso" },
  { key: "pending", label: "Pendientes" },
  { key: "completed", label: "Finalizadas" },
  { key: "cancelled", label: "Canceladas" },
];

type DriverAssignedRoutesHubProps = {
  routes: UseDriverPendingRoutesResult;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

function clampFlipDelay(delay: number) {
  return Math.min(delay, MAX_FLIP_DELAY_MS);
}

function destLabel(count: number) {
  return count === 1 ? "1 destino" : `${count} destinos`;
}

function unitsLabel(count: number) {
  return count === 1 ? "1 unidad" : `${count} unidades`;
}

function headerSubtitle(input: {
  loading: boolean;
  error: string | null;
  inRoute: number;
  pending: number;
  total: number;
}) {
  if (input.loading) return "Cargando tus rutas";
  if (input.error) return "No se pudieron cargar";
  if (input.total === 0) return "Sin rutas asignadas";
  if (input.inRoute === 1) return "Tienes 1 ruta en curso";
  if (input.inRoute > 1) return `Tienes ${input.inRoute} rutas en curso`;
  if (input.pending === 1) return "Tienes 1 ruta pendiente";
  if (input.pending > 1) return `Tienes ${input.pending} rutas pendientes`;
  return "Estás al día con tus rutas";
}

function routeAppearance(
  item: DriverAssignedRouteRecord,
  model: ReturnType<typeof buildDriverRouteListCardModel>,
) {
  if (model.isCancelada) {
    return {
      Icon: CloseCircle,
      well: ROSE_SOFT,
      tint: ROSE,
      badgeBg: ROSE_SOFT,
      badgeText: ROSE,
      hint: model.cancellationReason ?? model.summaryTitle,
    };
  }
  if (model.isCompleta) {
    return {
      Icon: TickCircle,
      well: DONE_SOFT,
      tint: DONE,
      badgeBg: DONE_SOFT,
      badgeText: DONE,
      hint: model.summaryTitle,
    };
  }
  if (model.isEnProceso) {
    return {
      Icon: Routing2,
      well: ACCENT_SOFT,
      tint: COLORS.accent,
      badgeBg: ACCENT_SOFT,
      badgeText: COLORS.accent,
      hint: model.summaryTitle,
    };
  }
  if (model.driverFullyConfirmed) {
    return {
      Icon: TickCircle,
      well: DONE_SOFT,
      tint: DONE,
      badgeBg: DONE_SOFT,
      badgeText: DONE,
      hint: model.summaryTitle,
    };
  }
  return {
    Icon: Box1,
    well: ACCENT_SOFT,
    tint: COLORS.accent,
    badgeBg: ACCENT_SOFT,
    badgeText: COLORS.accent,
    hint: driverRouteConfirmationSummaryLabel(item),
  };
}

function RouteCard({
  item,
  onPress,
}: {
  item: DriverAssignedRouteRecord;
  onPress: () => void;
}) {
  const model = buildDriverRouteListCardModel(item);
  const look = routeAppearance(item, model);
  const Icon = look.Icon;
  const hasCashPending =
    model.cashPendingHandoverMxn > 0 && !model.cashHandedOver;
  const vehicle = item.assignedVehiclesSummary?.trim();

  return (
    <SoftPressable
      onPress={onPress}
      scaleTo={0.99}
      accessibilityLabel={`Ver detalle de ruta ${item.folio}`}
    >
      <View style={styles.card}>
        <View style={[styles.iconWell, { backgroundColor: look.well }]}>
          <Icon size={20} color={look.tint} variant="Linear" />
        </View>
        <View style={styles.cardCopy}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.originWarehouseName}
            </Text>
            <View style={[styles.badge, { backgroundColor: look.badgeBg }]}>
              <Text style={[styles.badgeText, { color: look.badgeText }]}>
                {model.operationalStatusLabel}
              </Text>
            </View>
            {hasCashPending ? (
              <View style={[styles.badge, { backgroundColor: WARN_SOFT }]}>
                <Text style={[styles.badgeText, { color: WARN }]}>Caja</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {item.folio}
            {" · "}
            {destLabel(item.assignedDestinationsCount)}
            {" · "}
            {unitsLabel(item.assignedTotalUnits)}
          </Text>
          {look.hint ? (
            <Text
              style={[
                styles.cardDesc,
                model.isCancelada ? styles.cardDescDanger : null,
              ]}
              numberOfLines={2}
            >
              {look.hint}
            </Text>
          ) : null}
          {vehicle ? (
            <Text style={styles.cardMeta} numberOfLines={1}>
              {vehicle}
            </Text>
          ) : null}
        </View>
        <ArrowRight2 size={16} color={COLORS.muted} variant="Linear" />
      </View>
    </SoftPressable>
  );
}

function HubTabBar(props: {
  selected: HubTab;
  counts: Record<HubTab, number>;
  hasCashPendingInCompleted: boolean;
  onSelect: (tab: HubTab) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabRow}
    >
      {HUB_TABS.map((tab) => {
        const active = tab.key === props.selected;
        const count = props.counts[tab.key];
        const showDot =
          tab.key === "completed" && props.hasCashPendingInCompleted && !active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => props.onSelect(tab.key)}
            style={[styles.tab, active ? styles.tabActive : null]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            <Text style={[styles.tabTxt, active ? styles.tabTxtActive : null]}>
              {tab.label}
            </Text>
            {count > 0 ? (
              <View
                style={[styles.tabCount, active ? styles.tabCountActive : null]}
              >
                <Text
                  style={[
                    styles.tabCountTxt,
                    active ? styles.tabCountTxtActive : null,
                  ]}
                >
                  {count}
                </Text>
              </View>
            ) : null}
            {showDot ? <View style={styles.alertDot} /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function DriverAssignedRoutesHub({
  routes,
  onScroll,
}: DriverAssignedRoutesHubProps) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [activeTab, setActiveTab] = useState<HubTab>("in-progress");

  const { inRoute, ready, pendingConfirm, completed, cancelled } = useMemo(
    () => partitionDriverHubRoutes(routes.items),
    [routes.items],
  );

  const tabCounts = useMemo<Record<HubTab, number>>(
    () => ({
      "in-progress": inRoute.length,
      pending: pendingConfirm.length + ready.length,
      completed: completed.length,
      cancelled: cancelled.length,
    }),
    [
      cancelled.length,
      completed.length,
      inRoute.length,
      pendingConfirm.length,
      ready.length,
    ],
  );

  const hasCashPendingInCompleted = useMemo(
    () =>
      completed.some(
        (route) =>
          Number(route.driverCashPendingHandoverMxn ?? 0) > 0 &&
          !route.driverCashHandoverAtCdmx,
      ),
    [completed],
  );

  const onTabSelect = useCallback((tab: HubTab) => {
    setActiveTab(tab);
  }, []);

  const hubItems = useMemo(
    () => [...inRoute, ...ready, ...pendingConfirm, ...completed, ...cancelled],
    [cancelled, completed, inRoute, pendingConfirm, ready],
  );

  const allSections = useMemo(
    () =>
      [
        {
          key: "in-route",
          group: "in-progress" as HubTab,
          title: "En ruta",
          items: inRoute,
        },
        {
          key: "ready",
          group: "pending" as HubTab,
          title: "Listas para salir",
          items: ready,
        },
        {
          key: "pending",
          group: "pending" as HubTab,
          title: "Mercancía por confirmar",
          items: pendingConfirm,
        },
        {
          key: "completed",
          group: "completed" as HubTab,
          title: "Finalizadas",
          items: completed,
        },
        {
          key: "cancelled",
          group: "cancelled" as HubTab,
          title: "Canceladas",
          items: cancelled,
        },
      ].filter((section) => section.items.length > 0),
    [cancelled, completed, inRoute, pendingConfirm, ready],
  );

  const sections = useMemo(
    () => allSections.filter((section) => section.group === activeTab),
    [activeTab, allSections],
  );

  const openRoute = (routeId: string) => {
    navigateToDriverRouteDetail(navigation, routeId);
  };

  const showTabs = !routes.error && hubItems.length > 0;
  const showCenteredLoader = !routes.error && routes.loading && hubItems.length === 0;
  const showSectionTitle = sections.length > 1;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <HeaderTitle
          title="Mis rutas"
          subtitle={headerSubtitle({
            loading: routes.loading && hubItems.length === 0,
            error: routes.error,
            inRoute: inRoute.length,
            pending: pendingConfirm.length + ready.length,
            total: hubItems.length,
          })}
          tone="light"
          style={styles.header}
          onBack={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
        />
        {showTabs ? (
          <View style={styles.tabBar}>
            <HubTabBar
              selected={activeTab}
              counts={tabCounts}
              hasCashPendingInCompleted={hasCashPendingInCompleted}
              onSelect={onTabSelect}
            />
          </View>
        ) : null}
        {showCenteredLoader ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={routes.loading && routes.items.length > 0}
                onRefresh={() => void routes.refresh()}
                tintColor={COLORS.ink}
              />
            }
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: SCREEN_GUTTER,
              paddingTop: 8,
              paddingBottom: Math.max(tabBarHeight, insets.bottom) + 36,
            }}
          >
            {routes.error ? (
              <PageFlipReveal delay={0} active={isFocused}>
                <View style={styles.empty}>
                  <View style={styles.emptyWell}>
                    <Truck size={28} color={COLORS.accent} variant="Linear" />
                  </View>
                  <Text style={styles.emptyTitle}>{routes.error}</Text>
                  <SoftPressable
                    onPress={() => void routes.refresh()}
                    scaleTo={0.97}
                    style={styles.retryBtn}
                    accessibilityLabel="Reintentar"
                  >
                    <Text style={styles.retryTxt}>Reintentar</Text>
                  </SoftPressable>
                </View>
              </PageFlipReveal>
            ) : null}

            {!routes.error && !routes.loading && hubItems.length === 0 ? (
              <PageFlipReveal delay={0} active={isFocused}>
                <View style={styles.empty}>
                  <View style={styles.emptyWell}>
                    <Truck size={28} color={COLORS.accent} variant="Linear" />
                  </View>
                  <Text style={styles.emptyTitle}>Sin rutas asignadas</Text>
                  <Text style={styles.emptyText}>
                    Cuando tengas entregas en curso, pendientes, finalizadas o
                    canceladas, aparecen aquí.
                  </Text>
                </View>
              </PageFlipReveal>
            ) : null}

            {!routes.error && sections.length === 0 && hubItems.length > 0 ? (
              <PageFlipReveal delay={0} active={isFocused}>
                <View style={styles.empty}>
                  <View style={styles.emptyWell}>
                    <Truck size={28} color={COLORS.accent} variant="Linear" />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {activeTab === "cancelled"
                      ? "Aún no tienes rutas canceladas"
                      : "No hay rutas en esta categoría"}
                  </Text>
                </View>
              </PageFlipReveal>
            ) : null}

            {!routes.error
              ? sections.map((section, sectionIndex) => {
                  const prior = sections
                    .slice(0, sectionIndex)
                    .reduce(
                      (sum, item) =>
                        sum + item.items.length + (showSectionTitle ? 1 : 0),
                      0,
                    );
                  return (
                    <View
                      key={section.key}
                      style={
                        sectionIndex > 0
                          ? styles.sectionBlockFollow
                          : styles.sectionBlock
                      }
                    >
                      {showSectionTitle ? (
                        <PageFlipReveal
                          delay={clampFlipDelay(prior * FLIP_STAGGER_MS)}
                          active={isFocused}
                        >
                          <Text style={styles.sectionTitle}>{section.title}</Text>
                        </PageFlipReveal>
                      ) : null}
                      <View style={styles.list}>
                        {section.items.map((item, index) => (
                          <PageFlipReveal
                            key={item.id}
                            delay={clampFlipDelay(
                              (prior + (showSectionTitle ? 1 : 0) + index) *
                                FLIP_STAGGER_MS,
                            )}
                            active={isFocused}
                          >
                            <RouteCard
                              item={item}
                              onPress={() => openRoute(item.id)}
                            />
                          </PageFlipReveal>
                        ))}
                      </View>
                    </View>
                  );
                })
              : null}
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
  tabBar: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingBottom: 4,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
  },
  tabActive: {
    backgroundColor: ACCENT_SOFT,
  },
  tabTxt: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
  },
  tabTxtActive: {
    color: COLORS.accent,
  },
  tabCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    backgroundColor: "rgba(60, 60, 67, 0.08)",
  },
  tabCountActive: {
    backgroundColor: "rgba(234, 118, 0, 0.18)",
  },
  tabCountTxt: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
  },
  tabCountTxtActive: {
    color: COLORS.accent,
  },
  alertDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
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
  cardDescDanger: {
    color: ROSE,
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
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: ACCENT_SOFT,
  },
  retryTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accent,
  },
});
