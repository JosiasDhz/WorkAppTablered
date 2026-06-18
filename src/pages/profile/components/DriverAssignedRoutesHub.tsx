import React, { useEffect, useMemo, useRef } from "react";
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
  Box1,
  Calendar1,
  Car,
  Location,
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
import { TableRedColors } from "../../../theme/tableRedColors";

type DriverAssignedRoutesHubProps = {
  userName: string;
  avatarSource: ImageSourcePropType;
  routes: UseDriverPendingRoutesResult;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const C = TableRedColors;
const MAP_PREVIEW_HEIGHT = 108;

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
  pulse: boolean;
};

function routeTicketTheme(
  item: DriverAssignedRouteRecord,
  model: ReturnType<typeof buildDriverRouteListCardModel>,
): RouteTicketTheme {
  if (model.isCompleta) {
    return {
      accent: C.verde,
      badgeLabel: model.operationalStatusLabel,
      hint: model.summaryTitle,
      pulse: false,
    };
  }
  if (model.isEnProceso) {
    return {
      accent: C.naranja,
      badgeLabel: model.operationalStatusLabel,
      hint: model.summaryTitle,
      pulse: true,
    };
  }
  if (model.driverFullyConfirmed) {
    return {
      accent: C.verde,
      badgeLabel: model.operationalStatusLabel,
      hint: model.summaryTitle,
      pulse: false,
    };
  }
  return {
    accent: C.azul,
    badgeLabel: model.operationalStatusLabel,
    hint: driverRouteConfirmationSummaryLabel(item),
    pulse: false,
  };
}

function AnimatedStatCard(props: {
  label: string;
  value: number;
  accent: string;
  icon: React.ReactNode;
  delayMs: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const valueScale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 72,
          useNativeDriver: true,
        }),
        Animated.spring(valueScale, {
          toValue: 1,
          friction: 7,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    }, props.delayMs);
    return () => clearTimeout(timer);
  }, [opacity, props.delayMs, translateY, valueScale]);

  return (
    <Animated.View
      style={[
        styles.statCell,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.statTopRow}>
        <View style={[styles.statIconCircle, { backgroundColor: `${props.accent}18` }]}>
          {props.icon}
        </View>
        <Animated.Text
          style={[
            styles.statNum,
            { color: props.accent, transform: [{ scale: valueScale }] },
          ]}
        >
          {props.value}
        </Animated.Text>
      </View>
      <Text style={styles.statLbl}>{props.label}</Text>
    </Animated.View>
  );
}

function MetaChip(props: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.metaChip}>
      {props.icon}
      <Text style={styles.metaChipTxt}>{props.label}</Text>
    </View>
  );
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
  const { accent, badgeLabel, hint, pulse } = routeTicketTheme(item, model);
  const vehicle = item.assignedVehiclesSummary?.trim();
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
          <View style={ticketStyles.mapHero}>
            <DriverRouteCardMapPreview routeId={item.id} height={MAP_PREVIEW_HEIGHT} />
            <Animated.View
              style={[
                ticketStyles.mapBadge,
                {
                  backgroundColor: accent,
                  transform: pulse ? [{ scale: badgeScale }] : undefined,
                },
              ]}
            >
              <Text style={ticketStyles.mapBadgeTxt}>{badgeLabel}</Text>
            </Animated.View>
          </View>

          <View style={ticketStyles.body}>
            <Text style={ticketStyles.folio}>{item.folio}</Text>
            <Text style={ticketStyles.warehouse}>{item.originWarehouseName}</Text>
            <Text style={[ticketStyles.confirmHint, { color: accent }]}>{hint}</Text>

            <View style={ticketStyles.chipRow}>
              <MetaChip
                icon={<Calendar1 size={12} color={C.corteza} variant="Linear" />}
                label={formatRouteWhen(item.createdAtCdmx)}
              />
              {item.assignedDestinationsCount > 0 ? (
                <MetaChip
                  icon={<Location size={12} color={C.corteza} variant="Linear" />}
                  label={`${item.assignedDestinationsCount} ${
                    item.assignedDestinationsCount === 1 ? "parada" : "paradas"
                  }`}
                />
              ) : null}
              {item.assignedTotalUnits > 0 ? (
                <MetaChip
                  icon={<Box1 size={12} color={C.corteza} variant="Linear" />}
                  label={`${item.assignedTotalUnits} uds.`}
                />
              ) : null}
              {vehicle ? (
                <MetaChip
                  icon={<Car size={12} color={C.corteza} variant="Linear" />}
                  label={vehicle}
                />
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
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

  const { inRoute, ready, pendingConfirm, completed } = useMemo(
    () => partitionDriverHubRoutes(routes.items),
    [routes.items],
  );

  const hubItems = useMemo(
    () => [...inRoute, ...ready, ...pendingConfirm, ...completed],
    [completed, inRoute, pendingConfirm, ready],
  );

  const activeHubItems = useMemo(
    () => [...inRoute, ...ready, ...pendingConfirm],
    [inRoute, pendingConfirm, ready],
  );

  const totalStops = useMemo(
    () => activeHubItems.reduce((s, r) => s + (r.assignedDestinationsCount || 0), 0),
    [activeHubItems],
  );

  const activeSummary = useMemo(() => {
    if (inRoute.length > 0) {
      return `${inRoute.length} ${inRoute.length === 1 ? "ruta activa" : "rutas activas"}`;
    }
    if (ready.length > 0) {
      return `${ready.length} ${ready.length === 1 ? "lista para salir" : "listas para salir"}`;
    }
    if (pendingConfirm.length > 0) {
      return `${pendingConfirm.length} por confirmar`;
    }
    if (completed.length > 0) {
      return `${completed.length} ${completed.length === 1 ? "finalizada" : "finalizadas"}`;
    }
    return null;
  }, [completed.length, inRoute.length, pendingConfirm.length, ready.length]);

  const routeById = useMemo(() => {
    const map = new Map<string, DriverAssignedRouteRecord>();
    for (const route of routes.items) {
      map.set(route.id, route);
    }
    return map;
  }, [routes.items]);

  const sections = useMemo(
    () =>
      [
        {
          key: "in-route",
          title: "En ruta",
          accent: C.naranja,
          icon: <Routing2 size={15} color={C.naranja} variant="Bold" />,
          items: inRoute,
        },
        {
          key: "ready",
          title: "Listas para salir",
          accent: C.verde,
          icon: <TickCircle size={15} color={C.verdeHover} variant="Bold" />,
          items: ready,
        },
        {
          key: "pending",
          title: "Mercancía por confirmar",
          accent: C.azul,
          icon: <Box1 size={15} color={C.azul} variant="Bold" />,
          items: pendingConfirm,
        },
        {
          key: "completed",
          title: "Finalizadas",
          accent: C.verdeHover,
          icon: <TickCircle size={15} color={C.verdeHover} variant="Bold" />,
          items: completed,
        },
      ].filter((section) => section.items.length > 0),
    [completed, inRoute, pendingConfirm, ready],
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
      <View style={styles.headerShell}>
        <LinearGradient
          colors={[C.marron, C.corteza, "#5C534B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerGlowA} pointerEvents="none" />
        <View style={styles.headerGlowB} pointerEvents="none" />
        <Animated.View
          style={{
            opacity: headerOpacity,
            transform: [{ translateY: headerSlide }],
          }}
        >
          <View style={[styles.topBand, { paddingTop: insets.top + 4 }]}>
            <View style={styles.topBandInner}>
              <View style={styles.avatarRing}>
                <Image source={avatarSource} style={styles.avatar} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>Operaciones</Text>
                <Text style={styles.title}>Mis rutas</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  Hola, {userName}
                  {activeSummary ? ` · ${activeSummary}` : ""}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <AnimatedStatCard
              label="Por confirmar"
              value={pendingConfirm.length}
              accent={C.azul}
              icon={<Box1 size={12} color={C.azul} variant="Bold" />}
              delayMs={50}
            />
            <AnimatedStatCard
              label="Listas"
              value={ready.length}
              accent={C.verde}
              icon={<TickCircle size={12} color={C.verde} variant="Bold" />}
              delayMs={110}
            />
            <AnimatedStatCard
              label="Paradas"
              value={totalStops}
              accent={C.naranja}
              icon={<Location size={12} color={C.naranja} variant="Bold" />}
              delayMs={170}
            />
          </View>
        </Animated.View>
      </View>

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
          paddingTop: 14,
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
              salir o finalizadas, aparecerán aquí.
            </Text>
          </View>
        ) : null}

        {!routes.error
          ? sections.map((section) => (
              <HubSection
                key={section.key}
                title={section.title}
                accent={section.accent}
                count={section.items.length}
                icon={section.icon}
              >
                {section.items.map((item) => {
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
                })}
              </HubSection>
            ))
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const ticketStyles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.cardBorder,
    shadowColor: C.marron,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    overflow: "hidden",
  },
  clip: {
    overflow: "hidden",
    borderRadius: 16,
  },
  mapHero: {
    position: "relative",
    backgroundColor: C.crema,
  },
  mapBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  mapBadgeTxt: {
    fontSize: 10,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.2,
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  folio: {
    fontSize: 11,
    fontWeight: "800",
    color: C.gris,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  warehouse: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -0.2,
  },
  confirmHint: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  chipRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.crema,
  },
  headerShell: {
    zIndex: 2,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 10,
    overflow: "hidden",
  },
  headerGlowA: {
    position: "absolute",
    top: -50,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  headerGlowB: {
    position: "absolute",
    bottom: 10,
    left: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(234, 118, 0, 0.14)",
  },
  listScroll: {
    flex: 1,
  },
  topBand: {
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  topBandInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: C.naranja,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  kicker: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 0,
    color: C.white,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  sub: {
    marginTop: 1,
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 14,
    gap: 6,
  },
  statCell: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  statIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  statNum: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 20,
  },
  statLbl: {
    marginTop: 1,
    fontSize: 7,
    fontWeight: "700",
    color: C.gris,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  sectionBlock: {
    marginBottom: 6,
  },
  sectionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
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
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.crema,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.line,
  },
  metaChipTxt: {
    fontSize: 10,
    fontWeight: "600",
    color: C.corteza,
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
});
