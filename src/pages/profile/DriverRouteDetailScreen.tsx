import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  RouteProp,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Car, MoneyRecive, Routing2 } from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { PageFlipReveal } from "../../components/PageFlipReveal";
import { SoftPressable } from "../../components/SoftPressable";
import { SlideToStartAudit } from "../../components/SlideToStartAudit";
import { SCREEN_GUTTER } from "../../theme/layout";
import type { RootStackParamList } from "../../routes/RootStackParamList";
import { driverRouteStatusLabelEs } from "../../domain/driverRoutePending";
import { extractCancellationReason } from "../../domain/driverRouteListCardModel";
import {
  flattenDriverRouteConfirmLines,
  driverRouteNeedsDriverReceipt,
  isDriverRouteTransferLine,
} from "../../domain/driverRouteConfirmLines";
import { DRIVER_ROUTES_FLOW_USE_DEMO } from "./driverDemo/driverRoutesListDemoFlag";
import type { DriverRouteAssignmentDemoDestination } from "./driverDemo/driverRouteAssignmentDemo.types";
import { useDriverRouteAssignmentDetail } from "./hooks/useDriverRouteAssignmentDetail";
import { tripMapModelFromAssignment } from "./driverRoute/tripMapModelFromAssignment";
import { DriverRouteTripMapWebView } from "./driverRoute/DriverRouteTripMapWebView";
import { DriverRouteConfettiLayer } from "./driverRoute/DriverRouteConfettiLayer";
import { DriverRouteDetailAuditCards } from "./driverRoute/DriverRouteDetailAuditCards";
import { destinationsInRouteTravelOrder } from "./driverRoute/driverRouteDestinationsTravelOrder";
import {
  buildRouteProgressSteps,
  isDriverRouteStopDelivered,
} from "./driverRoute/deliveryStopProgress";
import { DriverRouteGlassDeliveryCard } from "./driverRoute/DriverRouteGlassDeliveryCard";
import { DriverRouteStatusCard } from "./driverRoute/DriverRouteStatusCard";

const COLORS = {
  surface: "#FFFFFF",
  ink: "#1C1C1E",
  muted: "#8E8E93",
  accent: "#EA7600",
};

const ACCENT_SOFT = "rgba(234, 118, 0, 0.14)";
const MAP_BORDER = "rgba(60, 60, 67, 0.22)";
const DONE = "#16A34A";
const DONE_SOFT = "rgba(22, 163, 74, 0.16)";
const ROSE = "#BE123C";
const ROSE_SOFT = "#FFF1F2";
const WARN = "#B45309";
const WARN_SOFT = "rgba(245, 158, 11, 0.18)";
const FLIP_STAGGER_MS = 70;
const MAX_FLIP_DELAY_MS = 700;
const PICKUP_SWIPE_DOCK_HEIGHT = 88;
const MAP_HEIGHT = 196;

function clampFlipDelay(delay: number) {
  return Math.min(delay, MAX_FLIP_DELAY_MS);
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatMxn(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n);
}

function canShowPickupDock(status: string): boolean {
  return (
    status !== "EN_PROCESO" &&
    status !== "COMPLETA" &&
    status !== "CANCELADA"
  );
}

function statusStyle(status: string): { bg: string; text: string } {
  if (status === "CANCELADA") return { bg: ROSE_SOFT, text: ROSE };
  if (status === "COMPLETA") return { bg: DONE_SOFT, text: DONE };
  if (status === "EN_PROCESO" || status === "LEVANTAMIENTO") {
    return { bg: ACCENT_SOFT, text: COLORS.accent };
  }
  return { bg: ACCENT_SOFT, text: COLORS.accent };
}

function statusSubline(
  status: string,
  stops: number,
  units: number,
  when: string,
  cancellationReason?: string | null,
): string {
  const stopsLabel = `${stops} ${stops === 1 ? "parada" : "paradas"}`;
  const unitsLabel = units > 0 ? ` · ${units} uds.` : "";
  if (status === "CANCELADA") {
    if (cancellationReason) return cancellationReason;
    return "Ruta cancelada — el envío volvió a listo para envío";
  }
  if (status === "EN_PROCESO") {
    return `${stopsLabel}${unitsLabel} — sigue el orden de las paradas`;
  }
  if (status === "LEVANTAMIENTO") {
    return `${stopsLabel}${unitsLabel} — desliza abajo para verificar el vehículo`;
  }
  if (status === "CONFIRMADA") {
    return `${stopsLabel}${unitsLabel} — desliza abajo para continuar la salida`;
  }
  if (status === "COMPLETA") {
    return `${stopsLabel}${unitsLabel} — finalizada ${when}`;
  }
  return `${stopsLabel}${unitsLabel} — revisa el recorrido antes de salir`;
}

function buildDestinationProgressRows(
  dest: DriverRouteAssignmentDemoDestination,
): { deliveryStatus?: string | null; isTransfer: boolean }[] {
  return dest.records.map((row) => ({
    deliveryStatus: row.deliveryStatus,
    isTransfer: isDriverRouteTransferLine({
      id: row.id,
      rowKind: row.rowKind,
      transferId: row.transferId,
      productName: row.productName,
      saleFolio: row.saleFolio,
      quantity: row.quantity,
      deliveryStatus: row.deliveryStatus,
    }),
  }));
}

export default function DriverRouteDetailScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const isFocused = useIsFocused();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, "DriverRouteDetail">>();
  const routeId = params?.routeId ?? "";
  const { detail, loading, error, refresh } = useDriverRouteAssignmentDetail(routeId);
  const mapModel = useMemo(
    () => (detail ? tripMapModelFromAssignment(detail) : { path: [], stops: [] }),
    [detail],
  );

  const [productsCollapsedByDestId, setProductsCollapsedByDestId] = useState<
    Record<string, boolean>
  >({});

  const routeOrderDestinations = useMemo(
    () => (detail ? destinationsInRouteTravelOrder(detail) : []),
    [detail],
  );

  const totalUnits = useMemo(
    () =>
      routeOrderDestinations.reduce(
        (sum, dest) => sum + dest.records.reduce((s, r) => s + (r.quantity || 0), 0),
        0,
      ),
    [routeOrderDestinations],
  );

  const goPickup = useCallback(async () => {
    if (!detail) return;
    const id = detail.route.id;
    const flatLines = flattenDriverRouteConfirmLines(detail.destinations);
    if (DRIVER_ROUTES_FLOW_USE_DEMO) {
      navigation.navigate("DriverRouteProductPickup", { routeId: id });
      return;
    }
    if (driverRouteNeedsDriverReceipt(flatLines)) {
      navigation.navigate("DriverRouteConfirmMercancia", { routeId: id });
      return;
    }
    navigation.navigate("DriverRouteProductPickup", { routeId: id });
  }, [navigation, detail]);

  const goNavDeliveries = useCallback(() => {
    if (!detail) return;
    navigation.navigate("DriverRouteNavFirstStop", { routeId: detail.route.id });
  }, [detail, navigation]);

  const routeStatus = detail?.route.status ?? null;
  const showPickupDock = routeStatus != null && canShowPickupDock(routeStatus);
  const showNavDock = routeStatus === "EN_PROCESO";
  const dockBottomPad = Math.max(insets.bottom, 12);
  const dockHeight =
    (showPickupDock ? PICKUP_SWIPE_DOCK_HEIGHT : showNavDock ? 72 : 0) +
    dockBottomPad;

  const isCompleta = routeStatus === "COMPLETA";
  const isEnProceso = routeStatus === "EN_PROCESO";
  const isCancelada = routeStatus === "CANCELADA";
  const cancellationReason = isCancelada
    ? extractCancellationReason(detail?.route.notes)
    : null;
  const completaFxPlayedRef = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const routeProgressRows = useMemo(() => {
    const rows: { deliveryStatus?: string | null; isTransfer: boolean }[] = [];
    for (const dest of routeOrderDestinations) {
      rows.push(...buildDestinationProgressRows(dest));
    }
    return rows;
  }, [routeOrderDestinations]);

  const routeProgressStops = useMemo(() => {
    return routeOrderDestinations.map((dest) => ({
      delivered: isDriverRouteStopDelivered({
        rows: buildDestinationProgressRows(dest),
        routeInProcess: isEnProceso,
        routeComplete: isCompleta,
      }),
    }));
  }, [routeOrderDestinations, isEnProceso, isCompleta]);

  const routeProgressSteps = useMemo(() => {
    if (!detail) return [];
    return buildRouteProgressSteps({
      rows: routeProgressRows,
      stops: routeProgressStops,
      routeStatus: detail.route.status,
      routeInProcess: isEnProceso,
      routeComplete: isCompleta,
    });
  }, [
    detail,
    isCompleta,
    isEnProceso,
    routeProgressRows,
    routeProgressStops,
  ]);

  const routeProgressAccent = isCompleta
    ? DONE
    : isCancelada
      ? ROSE
      : COLORS.accent;
  const toggleProducts = useCallback((destId: string) => {
    setProductsCollapsedByDestId((prev) => ({
      ...prev,
      [destId]: !(prev[destId] ?? true),
    }));
  }, []);

  useEffect(() => {
    if (!isCompleta || completaFxPlayedRef.current) return;
    completaFxPlayedRef.current = true;
    setShowConfetti(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [isCompleta]);

  if (loading && !detail) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
          <HeaderTitle
            title="Mi ruta"
            subtitle="Cargando detalle"
            tone="light"
            style={styles.header}
            onBack={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
          />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
          <HeaderTitle
            title="Mi ruta"
            subtitle="No se encontró el detalle"
            tone="light"
            style={styles.header}
            onBack={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
          />
          <View style={styles.centered}>
            <View style={styles.emptyWell}>
              <Routing2 size={28} color={COLORS.accent} variant="Linear" />
            </View>
            <Text style={styles.emptyTitle}>Sin datos</Text>
            <Text style={styles.emptyText}>
              {error ?? "No se pudo cargar esta ruta."}
            </Text>
            <SoftPressable
              onPress={() => void refresh()}
              scaleTo={0.97}
              style={styles.retryBtn}
              accessibilityLabel="Reintentar"
            >
              <Text style={styles.retryTxt}>Reintentar</Text>
            </SoftPressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const { route } = detail;
  const firstDest = routeOrderDestinations[0];
  const vehicle = firstDest?.vehicle;
  const vehicleLine = vehicle
    ? `${vehicle.model} · ${vehicle.plateNumber}`
    : "";
  const statusLabel = driverRouteStatusLabelEs(route.status);
  const badge = statusStyle(route.status);
  const whenLabel = formatWhen(route.createdAtCdmx);
  const pickupSwipeHint = driverRouteNeedsDriverReceipt(
    flattenDriverRouteConfirmLines(detail.destinations),
  )
    ? "Desliza para confirmar mercancía"
    : "Desliza para verificar vehículo";
  const cashPending = Math.max(
    0,
    Number(detail.route.driverCashPendingHandoverMxn) || 0,
  );
  const handedOver = Boolean(detail.route.driverCashHandoverAtCdmx);
  const showCashBanner = isCompleta && cashPending > 0 && !handedOver;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <HeaderTitle
          title="Mi ruta"
          subtitle={route.folio}
          tone="light"
          style={styles.header}
          onBack={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
        />
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: SCREEN_GUTTER,
            paddingTop: 8,
            paddingBottom: dockHeight + 36,
          }}
        >
          <PageFlipReveal delay={0} active={isFocused}>
            <View style={styles.heroCard}>
              <View style={styles.heroRow}>
                <View style={styles.heroIcon}>
                  <Routing2 size={22} color={COLORS.accent} variant="Linear" />
                </View>
                <View style={styles.heroText}>
                  <Text style={styles.heroTitle} numberOfLines={1}>
                    {route.originWarehouseName || "Almacén de origen"}
                  </Text>
                  <Text style={styles.heroSub} numberOfLines={2}>
                    {statusSubline(
                      route.status,
                      routeOrderDestinations.length,
                      totalUnits,
                      whenLabel,
                      cancellationReason,
                    )}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>
                    {statusLabel}
                  </Text>
                </View>
              </View>
              <Text style={styles.when}>{whenLabel}</Text>
            </View>
          </PageFlipReveal>

          {routeProgressSteps.length > 0 ? (
            <PageFlipReveal delay={FLIP_STAGGER_MS} active={isFocused}>
              <View style={styles.stepsCard}>
                <DriverRouteStatusCard
                  progressSteps={routeProgressSteps}
                  progressAccentColor={routeProgressAccent}
                />
              </View>
            </PageFlipReveal>
          ) : null}

          <PageFlipReveal delay={FLIP_STAGGER_MS * 2} active={isFocused}>
            <View style={styles.mapCard}>
              <DriverRouteTripMapWebView
                model={mapModel}
                height={MAP_HEIGHT}
                embedded
                interactive
                fitPadding={{ top: 36, right: 28, bottom: 76, left: 28 }}
                mapFitOptions={
                  isCompleta
                    ? {
                        maxZoom: 15,
                        minZoom: 11,
                        zoomBoost: false,
                        zoomOut: 1,
                        zoomSlack: 1,
                        softLock: true,
                        animateDraw: false,
                        strokeColor: DONE,
                      }
                    : {
                        maxZoom: 16,
                        minZoom: 11,
                        zoomBoost: false,
                        zoomOut: 1,
                        zoomSlack: 1,
                        softLock: true,
                        animateDraw: true,
                        strokeColor: COLORS.accent,
                      }
                }
              />
              {vehicleLine ? (
                <View style={styles.mapVehicle} pointerEvents="none">
                  <View style={styles.mapVehicleIcon}>
                    <Car size={16} color={COLORS.accent} variant="Linear" />
                  </View>
                  <View style={styles.mapVehicleCopy}>
                    <Text style={styles.mapVehicleLabel}>Vehículo</Text>
                    <Text style={styles.mapVehicleValue} numberOfLines={1}>
                      {vehicleLine}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </PageFlipReveal>

          {showCashBanner ? (
            <PageFlipReveal delay={FLIP_STAGGER_MS * 2} active={isFocused}>
              <View style={styles.cashCard}>
                <View style={[styles.heroIcon, { backgroundColor: WARN_SOFT }]}>
                  <MoneyRecive size={22} color={WARN} variant="Linear" />
                </View>
                <View style={styles.heroText}>
                  <Text style={styles.cashAmount}>{formatMxn(cashPending)}</Text>
                  <Text style={styles.cashHint}>
                    Pendiente de entregar a caja
                  </Text>
                </View>
              </View>
            </PageFlipReveal>
          ) : null}

          {isEnProceso ? (
            <PageFlipReveal delay={FLIP_STAGGER_MS * 2} active={isFocused}>
              <SoftPressable
                onPress={() =>
                  navigation.navigate("DriverRouteReportIncident", {
                    routeId: detail.route.id,
                  })
                }
                scaleTo={0.99}
                accessibilityLabel="Reportar daño en ruta"
              >
                <View style={styles.reportCard}>
                  <Text style={styles.reportTxt}>Reportar daño en ruta</Text>
                </View>
              </SoftPressable>
            </PageFlipReveal>
          ) : null}

          <View style={styles.sectionBlock}>
            <PageFlipReveal
              delay={clampFlipDelay(FLIP_STAGGER_MS * 3)}
              active={isFocused}
            >
              <Text style={styles.sectionTitle}>
                Envíos y traspasos
                {routeOrderDestinations.length > 0
                  ? ` · ${routeOrderDestinations.length}`
                  : ""}
              </Text>
            </PageFlipReveal>
            <View style={styles.list}>
              {routeOrderDestinations.map((dest, index) => (
                <PageFlipReveal
                  key={dest.id}
                  delay={clampFlipDelay((index + 4) * FLIP_STAGGER_MS)}
                  active={isFocused}
                >
                  <DriverRouteGlassDeliveryCard
                    destination={dest}
                    displayNum={index + 1}
                    originLabel={route.originWarehouseName || "almacén"}
                    routeInProcess={isEnProceso}
                    routeComplete={isCompleta}
                    productsCollapsed={productsCollapsedByDestId[dest.id] ?? true}
                    onToggleProducts={() => toggleProducts(dest.id)}
                  />
                </PageFlipReveal>
              ))}
              {isCancelada && routeOrderDestinations.length === 0 ? (
                <Text style={styles.emptyText}>
                  Los envíos volvieron a listo para envío. El mapa conserva el
                  recorrido planificado.
                </Text>
              ) : null}
            </View>
          </View>

          {isCompleta ? (
            <View style={styles.sectionBlockFollow}>
              <PageFlipReveal
                delay={clampFlipDelay(FLIP_STAGGER_MS * 5)}
                active={isFocused}
              >
                <Text style={styles.sectionTitle}>Auditoría y evidencias</Text>
              </PageFlipReveal>
              <DriverRouteDetailAuditCards detail={detail} />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      {showPickupDock ? (
        <View style={[styles.pickupDock, { paddingBottom: dockBottomPad }]}>
          <SlideToStartAudit
            inDock
            hintText={pickupSwipeHint}
            onSlideComplete={goPickup}
            busy={false}
          />
        </View>
      ) : null}

      {showNavDock ? (
        <View style={[styles.pickupDock, { paddingBottom: dockBottomPad }]}>
          <SoftPressable
            onPress={goNavDeliveries}
            scaleTo={0.98}
            accessibilityLabel="Continuar entregas"
          >
            <View style={styles.dockBtn}>
              <Text style={styles.dockBtnTxt}>Continuar entregas</Text>
            </View>
          </SoftPressable>
        </View>
      ) : null}

      {showConfetti ? (
        <View style={styles.confettiHost} pointerEvents="none">
          <DriverRouteConfettiLayer
            active
            pieceCount={42}
            fallDistance={windowHeight + 80}
            onFinished={() => setShowConfetti(false)}
          />
        </View>
      ) : null}
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
  scroll: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.ink,
    textAlign: "center",
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
    textAlign: "center",
  },
  mapCard: {
    height: MAP_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: MAP_BORDER,
  },
  mapVehicle: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mapVehicleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  mapVehicleCopy: {
    flex: 1,
    minWidth: 0,
  },
  mapVehicleLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.muted,
  },
  mapVehicleValue: {
    marginTop: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.ink,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  stepsCard: {
    marginBottom: 12,
    marginHorizontal: -SCREEN_GUTTER,
    alignItems: "center",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.ink,
  },
  heroSub: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: COLORS.muted,
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
  when: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
    textTransform: "capitalize",
  },
  cashCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cashAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: WARN,
  },
  cashHint: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
  },
  reportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  reportTxt: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.accent,
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
  pickupDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 10,
  },
  dockBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  dockBtnTxt: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  confettiHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    elevation: 30,
  },
});
