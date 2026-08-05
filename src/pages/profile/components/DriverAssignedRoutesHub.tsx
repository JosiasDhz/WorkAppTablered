import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { navigateToDriverRouteDetail } from "../../../routes/navigateDriverRoutesFromProfileTab";
import {
  ArrowRight2,
  Box1,
  Calendar1,
  Car,
  CloseCircle,
  Location,
  MoneyRecive,
  Notification,
  Routing2,
  TickCircle,
  Truck,
} from "iconsax-react-native";
import { driverRouteConfirmationSummaryLabel } from "../../../domain/driverRouteConfirmation";
import { buildDriverRouteListCardModel } from "../../../domain/driverRouteListCardModel";
import { partitionDriverHubRoutes } from "../../../domain/driverRouteHubVisibility";
import type { DriverAssignedRouteRecord } from "../../../services/driverRoutesService";
import type { UseDriverPendingRoutesResult } from "../hooks/useDriverPendingRoutes";
import { DriverRouteCardMapPreview } from "./DriverRouteCardMapPreview";
import { DELIVERY_ROUTE_PROGRESS_ACCENT } from "../driverRoute/deliveryRouteProgressTheme";
import { TableRedColors } from "../../../theme/tableRedColors";

type DriverAssignedRoutesHubProps = {
  userName: string;
  avatarSource: ImageSourcePropType;
  routes: UseDriverPendingRoutesResult;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const C = TableRedColors;
const MAP_PREVIEW_HEIGHT = 124;
const VIVID_GREEN = DELIVERY_ROUTE_PROGRESS_ACCENT.complete;

type HubTab = "in-progress" | "pending" | "completed" | "cancelled";
type HubTabDef = { key: HubTab; label: string; color: string };
const HUB_TABS: HubTabDef[] = [
  { key: "in-progress", label: "En curso", color: "#2563EB" },
  { key: "pending", label: "Pendientes", color: "#D97706" },
  { key: "completed", label: "Finalizadas", color: "#10B981" },
  { key: "cancelled", label: "Canceladas", color: "#E11D48" },
];

function formatRouteWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

type RouteTicketTheme = {
  accent: string;
  badgeLabel: string;
  hint: string;
  hintMuted: boolean;
  pulse: boolean;
};

function routeTicketTheme(
  item: DriverAssignedRouteRecord,
  model: ReturnType<typeof buildDriverRouteListCardModel>,
): RouteTicketTheme {
  if (model.isCancelada) {
    return {
      accent: "#E11D48",
      badgeLabel: model.operationalStatusLabel,
      hint: model.cancellationReason ?? model.summaryTitle,
      hintMuted: false,
      pulse: false,
    };
  }
  if (model.isCompleta) {
    return {
      accent: VIVID_GREEN,
      badgeLabel: model.operationalStatusLabel,
      hint: model.summaryTitle,
      hintMuted: true,
      pulse: false,
    };
  }
  if (model.isEnProceso) {
    return {
      accent: DELIVERY_ROUTE_PROGRESS_ACCENT.inProcess,
      badgeLabel: model.operationalStatusLabel,
      hint: model.summaryTitle,
      hintMuted: false,
      pulse: true,
    };
  }
  if (model.driverFullyConfirmed) {
    return {
      accent: VIVID_GREEN,
      badgeLabel: model.operationalStatusLabel,
      hint: model.summaryTitle,
      hintMuted: false,
      pulse: false,
    };
  }
  return {
    accent: DELIVERY_ROUTE_PROGRESS_ACCENT.pending,
    badgeLabel: model.operationalStatusLabel,
    hint: driverRouteConfirmationSummaryLabel(item),
    hintMuted: false,
    pulse: false,
  };
}

function parseVehicleSummary(summary: string): { model: string; plate: string | null } {
  const parts = summary
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { model: parts[0]!, plate: parts.slice(1).join(" · ") };
  }
  return { model: summary.trim(), plate: null };
}

function RouteTicket({
  item,
  index,
  onPress,
}: {
  item: DriverAssignedRouteRecord;
  index: number;
  onPress: () => void;
}) {
  const model = buildDriverRouteListCardModel(item);
  const { accent, badgeLabel, hint, hintMuted, pulse } = routeTicketTheme(item, model);
  const vehicle = item.assignedVehiclesSummary?.trim();
  const vehicleParts = vehicle ? parseVehicleSummary(vehicle) : null;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const badgePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 440,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 64,
          useNativeDriver: true,
        }),
      ]).start();
    }, 70 + index * 65);
    return () => clearTimeout(timer);
  }, [index, opacity, translateY]);

  useEffect(() => {
    if (!pulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(badgePulse, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [badgePulse, pulse]);

  const badgeScale = badgePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.978,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const hasCashPending = model.cashPendingHandoverMxn > 0 && !model.cashHandedOver;

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={ticketStyles.wrap}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalle de ruta ${item.folio}`}
      >
        <View style={ticketStyles.clip}>
          <View style={ticketStyles.mapCard}>
            <View style={[ticketStyles.accentBar, { backgroundColor: accent }]} />
            <DriverRouteCardMapPreview
              routeId={item.id}
              height={120}
              routeComplete={model.isCompleta}
              routeInProcess={model.isEnProceso}
              routeCancelled={model.isCancelada}
            />
          </View>

          <View style={ticketStyles.infoCard}>
            <View style={ticketStyles.chipsRow}>
              <Animated.View
                style={[
                  ticketStyles.statusChip,
                  {
                    backgroundColor: accent,
                    transform: pulse ? [{ scale: badgeScale }] : undefined,
                  },
                ]}
              >
                <View style={ticketStyles.statusDot} />
                <Text style={ticketStyles.statusTxt}>{badgeLabel}</Text>
              </Animated.View>
              {hasCashPending ? (
                <View style={ticketStyles.cashChip}>
                  <MoneyRecive size={9} color="#92400E" variant="Bold" />
                  <Text style={ticketStyles.cashChipTxt}>Caja</Text>
                </View>
              ) : null}
            </View>
            <View style={ticketStyles.infoTop}>
              <View style={ticketStyles.infoHeader}>
                <Text style={ticketStyles.folio}>{item.folio}</Text>
                <Text style={ticketStyles.warehouse} numberOfLines={1}>
                  {item.originWarehouseName}
                </Text>
              </View>
              <View style={[ticketStyles.arrowCircle, { backgroundColor: `${accent}18` }]}>
                <ArrowRight2 size={14} color={accent} variant="Linear" />
              </View>
            </View>

            {vehicleParts ? (
              <View style={ticketStyles.vehicleRow}>
                <Car size={11} color={C.gris} variant="Bold" />
                <Text style={ticketStyles.vehicleTxt} numberOfLines={1}>
                  {vehicleParts.model}
                  {vehicleParts.plate ? ` · ${vehicleParts.plate}` : ""}
                </Text>
              </View>
            ) : null}

            {hint ? (
              <Text
                style={[
                  ticketStyles.hintTxt,
                  hintMuted ? ticketStyles.hintTxtMuted : undefined,
                  model.isCancelada ? ticketStyles.hintTxtCancelled : undefined,
                ]}
                numberOfLines={2}
              >
                {hint}
              </Text>
            ) : null}

            <View style={ticketStyles.metricsRow}>
              <View style={ticketStyles.metric}>
                <Location size={12} color={C.gris} variant="Linear" />
                <Text style={ticketStyles.metricVal}>
                  {item.assignedDestinationsCount}
                </Text>
              </View>
              <View style={ticketStyles.metricSep} />
              <View style={ticketStyles.metric}>
                <Box1 size={12} color={C.gris} variant="Linear" />
                <Text style={ticketStyles.metricVal}>
                  {item.assignedTotalUnits}
                </Text>
              </View>
              <View style={ticketStyles.metricSep} />
              <View style={ticketStyles.metric}>
                <Calendar1 size={11} color={C.gris} variant="Linear" />
                <Text style={ticketStyles.metricDate} numberOfLines={1}>
                  {formatRouteWhen(item.createdAtCdmx)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function HubTabBar(props: {
  selected: HubTab;
  counts: Record<HubTab, number>;
  hasCashPendingInCompleted: boolean;
  onSelect: (tab: HubTab) => void;
}) {
  return (
    <View style={tabBarStyles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tabBarStyles.row}
      >
        {HUB_TABS.map((tab) => {
          const active = tab.key === props.selected;
          const count = props.counts[tab.key];
          const showDot =
            tab.key === "completed" && props.hasCashPendingInCompleted && !active;
          return (
            <Pressable
              key={tab.key}
              style={[
                tabBarStyles.tab,
                active ? { backgroundColor: tab.color } : undefined,
              ]}
              onPress={() => props.onSelect(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  tabBarStyles.tabTxt,
                  active ? tabBarStyles.tabTxtActive : tabBarStyles.tabTxtInactive,
                ]}
              >
                {tab.label}
              </Text>
              {count > 0 ? (
                <View
                  style={[
                    tabBarStyles.tabCount,
                    active
                      ? tabBarStyles.tabCountActive
                      : tabBarStyles.tabCountInactive,
                  ]}
                >
                  <Text
                    style={[
                      tabBarStyles.tabCountTxt,
                      active
                        ? tabBarStyles.tabCountTxtActive
                        : tabBarStyles.tabCountTxtInactive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              ) : null}
              {showDot ? <View style={tabBarStyles.alertDot} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function HubSection(props: {
  title: string;
  accent: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionBlock}>
      <View style={[styles.sectionPill, { borderColor: `${props.accent}30` }]}>
        <View style={[styles.sectionIconWrap, { backgroundColor: `${props.accent}16` }]}>
          {props.icon}
        </View>
        <Text style={styles.sectionTitle}>{props.title}</Text>
        <View style={[styles.sectionCount, { backgroundColor: props.accent }]}>
          <Text style={styles.sectionCountTxt}>{props.count}</Text>
        </View>
      </View>
      {props.children}
    </View>
  );
}

export function DriverAssignedRoutesHub({
  userName,
  avatarSource,
  routes,
  onScroll,
}: DriverAssignedRoutesHubProps) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;
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
        (r) =>
          Number(r.driverCashPendingHandoverMxn ?? 0) > 0 &&
          !r.driverCashHandoverAtCdmx,
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

  const routeById = useMemo(() => {
    const map = new Map<string, DriverAssignedRouteRecord>();
    for (const route of routes.items) {
      map.set(route.id, route);
    }
    return map;
  }, [routes.items]);

  const allSections = useMemo(
    () =>
      [
        {
          key: "in-route",
          group: "in-progress" as HubTab,
          title: "En ruta",
          accent: C.naranja,
          icon: <Routing2 size={15} color={C.naranja} variant="Bold" />,
          items: inRoute,
        },
        {
          key: "ready",
          group: "pending" as HubTab,
          title: "Listas para salir",
          accent: VIVID_GREEN,
          icon: <TickCircle size={15} color={VIVID_GREEN} variant="Bold" />,
          items: ready,
        },
        {
          key: "pending",
          group: "pending" as HubTab,
          title: "Mercancía por confirmar",
          accent: C.azul,
          icon: <Box1 size={15} color={C.azul} variant="Bold" />,
          items: pendingConfirm,
        },
        {
          key: "completed",
          group: "completed" as HubTab,
          title: "Finalizadas",
          accent: VIVID_GREEN,
          icon: <TickCircle size={15} color={VIVID_GREEN} variant="Bold" />,
          items: completed,
        },
        {
          key: "cancelled",
          group: "cancelled" as HubTab,
          title: "Canceladas",
          accent: "#E11D48",
          icon: <CloseCircle size={15} color="#E11D48" variant="Bold" />,
          items: cancelled,
        },
      ].filter((section) => section.items.length > 0),
    [cancelled, completed, inRoute, pendingConfirm, ready],
  );

  const sections = useMemo(
    () => allSections.filter((s) => s.group === activeTab),
    [activeTab, allSections],
  );

  useEffect(() => {
    headerOpacity.setValue(0);
    headerSlide.setValue(-16);
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        friction: 8,
        tension: 68,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerOpacity, headerSlide, routes.items.length]);

  const openRoute = (routeId: string) => {
    if (!routeById.get(routeId)) return;
    navigateToDriverRouteDetail(navigation, routeId);
  };

  let ticketIndex = 0;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <Animated.View
        style={[
          styles.headerBar,
          {
            paddingTop: insets.top + 12,
            opacity: headerOpacity,
            transform: [{ translateY: headerSlide }],
          },
        ]}
      >
        <View style={styles.headerBottom}>
          <View style={styles.avatarRing}>
            <Image source={avatarSource} style={styles.avatar} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Mis rutas</Text>
            <Text style={styles.sub} numberOfLines={1}>
              Gestiona tus entregas del día
            </Text>
          </View>
          <Pressable
            style={styles.notifBtn}
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Notificaciones"
          >
            <View style={styles.notifDot} />
            <Notification size={20} color={C.ink} variant="Bold" />
          </Pressable>
        </View>
      </Animated.View>

      {!routes.error && hubItems.length > 0 ? (
        <View style={styles.tabBarFixed}>
          <HubTabBar
            selected={activeTab}
            counts={tabCounts}
            hasCashPendingInCompleted={hasCashPendingInCompleted}
            onSelect={onTabSelect}
          />
        </View>
      ) : null}

      <ScrollView
        style={styles.listScroll}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={routes.loading && routes.items.length > 0}
            onRefresh={() => void routes.refresh()}
            tintColor={C.naranja}
          />
        }
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: tabBarHeight + 36,
          paddingHorizontal: 14,
        }}
      >
        {routes.error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>{routes.error}</Text>
            <TouchableOpacity
              style={styles.retry}
              onPress={() => void routes.refresh()}
              activeOpacity={0.85}
            >
              <Text style={styles.retryTxt}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!routes.error && routes.loading && hubItems.length === 0 ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={C.naranja} />
            <Text style={styles.loaderTxt}>Cargando tus rutas…</Text>
          </View>
        ) : null}

        {!routes.error && !routes.loading && hubItems.length === 0 ? (
          <View style={styles.empty}>
            <LinearGradient
              colors={[`${C.naranja}12`, `${C.verde}10`]}
              style={styles.emptyGradient}
            >
              <View style={styles.emptyIconCircle}>
                <Truck size={42} color={C.corteza} variant="Linear" />
              </View>
            </LinearGradient>
            <Text style={styles.emptyTitle}>Sin rutas asignadas</Text>
            <Text style={styles.emptySub}>
              Cuando tengas entregas en curso, mercancía por confirmar, rutas listas para
              salir, finalizadas o canceladas, aparecerán aquí.
            </Text>
          </View>
        ) : null}

        {!routes.error && sections.length === 0 && hubItems.length > 0 ? (
          <View style={styles.tabEmpty}>
            <Text style={styles.tabEmptyTxt}>
              {activeTab === "cancelled"
                ? "Aún no tienes rutas canceladas"
                : "No hay rutas en esta categoría"}
            </Text>
          </View>
        ) : null}

        {!routes.error
          ? sections.map((section) =>
              section.items.map((item) => {
                const currentIndex = ticketIndex;
                ticketIndex += 1;
                return (
                  <RouteTicket
                    key={item.id}
                    item={item}
                    index={currentIndex}
                    onPress={() => openRoute(item.id)}
                  />
                );
              }),
            )
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const ticketStyles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  clip: {
    flexDirection: "row",
    gap: 8,
  },
  mapCard: {
    width: 130,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 2,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  infoTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  infoHeader: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#FFFFFF",
  },
  statusTxt: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  cashChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  cashChipTxt: {
    fontSize: 9,
    fontWeight: "800",
    color: "#92400E",
  },
  folio: {
    fontSize: 9,
    fontWeight: "700",
    color: C.gris,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  warehouse: {
    fontSize: 15,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.3,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  vehicleTxt: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: C.gris,
  },
  hintTxt: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: C.ink,
    lineHeight: 16,
  },
  hintTxtMuted: {
    fontWeight: "600",
    color: C.gris,
  },
  hintTxtCancelled: {
    color: "#BE123C",
  },
  metricsRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: "800",
    color: C.corteza,
  },
  metricDate: {
    fontSize: 9,
    fontWeight: "600",
    color: C.gris,
    flexShrink: 1,
  },
  metricSep: {
    width: 1,
    height: 12,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#F1F5F9",
    zIndex: 2,
  },
  headerBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  tabBarFixed: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    backgroundColor: "#F1F5F9",
    zIndex: 1,
  },
  listScroll: {
    flex: 1,
  },
  avatarRing: {
    borderRadius: 24,
    overflow: "hidden",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.6,
  },
  sub: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
    color: C.gris,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.naranja,
    zIndex: 1,
    borderWidth: 1.5,
    borderColor: C.white,
  },
  sectionBlock: {
    marginBottom: 10,
  },
  sectionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: C.marron,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: C.ink,
  },
  sectionCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  sectionCountTxt: {
    fontSize: 12,
    fontWeight: "800",
    color: C.white,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: {
    color: "#991B1B",
    fontSize: 14,
    fontWeight: "600",
  },
  retry: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: C.naranja,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryTxt: {
    color: C.white,
    fontWeight: "800",
    fontSize: 14,
  },
  loader: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 12,
  },
  loaderTxt: {
    fontSize: 14,
    fontWeight: "600",
    color: C.gris,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyGradient: {
    borderRadius: 56,
    padding: 4,
    marginBottom: 18,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.ink,
    textAlign: "center",
  },
  emptySub: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    color: C.gris,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 300,
  },
  tabEmpty: {
    paddingVertical: 32,
    alignItems: "center",
  },
  tabEmptyTxt: {
    fontSize: 14,
    fontWeight: "600",
    color: C.gris,
  },
});

const tabBarStyles = StyleSheet.create({
  container: {
    backgroundColor: "#3D3630",
    borderRadius: 16,
    padding: 6,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexGrow: 1,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  tabActive: {
    backgroundColor: C.marron,
    borderColor: C.marron,
  },
  tabTxt: {
    fontSize: 12,
    fontWeight: "700",
  },
  tabTxtActive: {
    color: C.white,
  },
  tabTxtInactive: {
    color: "rgba(255,255,255,0.7)",
  },
  tabCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabCountActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  tabCountInactive: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  tabCountTxt: {
    fontSize: 10,
    fontWeight: "800",
  },
  tabCountTxtActive: {
    color: C.white,
  },
  tabCountTxtInactive: {
    color: "rgba(255,255,255,0.6)",
  },
  alertDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.naranja,
    borderWidth: 2,
    borderColor: "#3D3630",
  },
});
