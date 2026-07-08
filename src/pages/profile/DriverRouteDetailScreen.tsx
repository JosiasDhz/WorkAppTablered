import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Car } from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SlideToStartAudit } from "../../components/SlideToStartAudit";
import type { RootStackParamList } from "../../routes/RootStackParamList";
import { driverRouteStatusLabelEs } from "../../domain/driverRoutePending";
import {
  driverRouteConfirmProgress,
  flattenDriverRouteConfirmLines,
} from "../../domain/driverRouteConfirmLines";
import { DRIVER_ROUTES_FLOW_USE_DEMO } from "./driverDemo/driverRoutesListDemoFlag";
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
import { isDriverRouteTransferLine } from "../../domain/driverRouteConfirmLines";
import { DriverRouteGlassDeliveryCard } from "./driverRoute/DriverRouteGlassDeliveryCard";
import { DriverRouteStatusCard } from "./driverRoute/DriverRouteStatusCard";
import { RouteGlassPanel } from "./driverRoute/RouteGlassPanel";
import { TableRedColors } from "../../theme/tableRedColors";

const C = TableRedColors;

const HEADER_BODY_HEIGHT = 56;
const STATUS_SHEET_ESTIMATE = 196;
const MAP_FIT_BOTTOM_RESERVE = 156;
const MAP_FIT_ZOOM_OUT = 0;
const STATUS_SHEET_PEEK_GAP = 148;
const SHEET_SCROLL_OFFSET = 36;
const PICKUP_SWIPE_DOCK_HEIGHT = 88;

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

function canShowPickupDock(status: string): boolean {
  return (
    status !== "EN_PROCESO" &&
    status !== "COMPLETA" &&
    status !== "CANCELADA"
  );
}

function statusBadgeTone(status: string): {
  borderColor: string;
  dotColor: string;
  textColor: string;
} {
  if (status === "EN_PROCESO" || status === "LEVANTAMIENTO") {
    return { borderColor: C.naranja, dotColor: C.naranja, textColor: C.naranja };
  }
  if (status === "CONFIRMADA" || status === "COMPLETA") {
    return { borderColor: C.verde, dotColor: C.verdeHover, textColor: C.verdeHover };
  }
  return { borderColor: C.azul, dotColor: C.azul, textColor: C.azul };
}

function statusSubline(
  status: string,
  stops: number,
  units: number,
  when: string,
): string {
  const stopsLabel = `${stops} ${stops === 1 ? "parada" : "paradas"}`;
  const unitsLabel = units > 0 ? ` · ${units} uds.` : "";
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

function InfoPill(props: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.infoPill}>
      {props.icon}
      <Text style={styles.infoPillTxt} numberOfLines={2}>
        {props.text}
      </Text>
    </View>
  );
}

import type { DriverRouteAssignmentDemoDestination } from "./driverDemo/driverRouteAssignmentDemo.types";

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
  const { height: winH } = useWindowDimensions();
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

  const confirmProgress = useMemo(() => {
    if (!detail) return null;
    return driverRouteConfirmProgress(flattenDriverRouteConfirmLines(detail.destinations));
  }, [detail]);

  const goPickup = useCallback(async () => {
    if (!detail) return;
    const id = detail.route.id;
    if (DRIVER_ROUTES_FLOW_USE_DEMO) {
      navigation.navigate("DriverRouteProductPickup", { routeId: id });
      return;
    }
    if (confirmProgress && !confirmProgress.allConfirmed) {
      navigation.navigate("DriverRouteConfirmMercancia", { routeId: id });
      return;
    }
    navigation.navigate("DriverRouteProductPickup", { routeId: id });
  }, [navigation, detail, confirmProgress]);

  const goNavDeliveries = useCallback(() => {
    if (!detail) return;
    navigation.navigate("DriverRouteNavFirstStop", { routeId: detail.route.id });
  }, [detail, navigation]);

  const routeStatus = detail?.route.status ?? null;
  const showPickupDock = routeStatus != null && canShowPickupDock(routeStatus);
  const showNavDock = routeStatus === "EN_PROCESO";

  const dockBottomPad = Math.max(insets.bottom, 12);
  const dockHeight =
    (showPickupDock
      ? PICKUP_SWIPE_DOCK_HEIGHT
      : showNavDock
        ? 72
        : 0) + dockBottomPad;
  const topChromeTop = insets.top + HEADER_BODY_HEIGHT;

  const mapSpacerHeight = Math.max(
    Math.round(topChromeTop + 32 + SHEET_SCROLL_OFFSET),
    Math.round(
      winH -
        dockHeight -
        STATUS_SHEET_ESTIMATE -
        STATUS_SHEET_PEEK_GAP +
        SHEET_SCROLL_OFFSET,
    ),
  );

  const mapFitPadding = useMemo(
    () => ({
      top: Math.round(topChromeTop + 44),
      right: 36,
      bottom: Math.round(dockHeight + MAP_FIT_BOTTOM_RESERVE),
      left: 36,
    }),
    [dockHeight, topChromeTop],
  );

  const isCompleta = routeStatus === "COMPLETA";
  const isEnProceso = routeStatus === "EN_PROCESO";
  const statusDotPulse = useRef(new Animated.Value(0)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const sheetSlide = useRef(new Animated.Value(28)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;
  const detailsSlide = useRef(new Animated.Value(20)).current;
  const completaFxPlayedRef = useRef(false);

  const stopDeliveryCounts = useMemo(() => {
    if (!detail) return { delivered: 0, pending: 0 };
    let delivered = 0;
    let pending = 0;
    for (const dest of routeOrderDestinations) {
      const done = isDriverRouteStopDelivered({
        rows: buildDestinationProgressRows(dest),
        routeInProcess: isEnProceso,
        routeComplete: isCompleta,
      });
      if (done) delivered += 1;
      else pending += 1;
    }
    return { delivered, pending };
  }, [detail, routeOrderDestinations, isEnProceso, isCompleta]);

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
    ? "#10B981"
    : isEnProceso
      ? C.naranja
      : C.azul;

  useEffect(() => {
    if (!detail) return;
    sheetOpacity.setValue(0);
    sheetSlide.setValue(28);
    detailsOpacity.setValue(0);
    detailsSlide.setValue(20);

    Animated.parallel([
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(sheetSlide, {
        toValue: 0,
        friction: 8,
        tension: 72,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(isCompleta ? 260 : 120),
      Animated.parallel([
        Animated.timing(detailsOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.spring(detailsSlide, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [
    detail,
    detailsOpacity,
    detailsSlide,
    isCompleta,
    sheetOpacity,
    sheetSlide,
  ]);

  useEffect(() => {
    if (!isEnProceso) return;
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(statusDotPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(statusDotPulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    dotLoop.start();
    return () => {
      dotLoop.stop();
    };
  }, [isEnProceso, statusDotPulse]);

  useEffect(() => {
    if (!isCompleta || completaFxPlayedRef.current) return;
    completaFxPlayedRef.current = true;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [isCompleta]);

  const toggleProducts = useCallback((destId: string) => {
    setProductsCollapsedByDestId((prev) => ({
      ...prev,
      [destId]: !(prev[destId] ?? true),
    }));
  }, []);

  if (loading && !detail) {
    return (
      <View style={styles.safe}>
        <View style={{ paddingTop: insets.top }}>
          <HeaderTitle title="Ruta" subtitle="Cargando detalle…" tone="light" />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={C.naranja} />
        </View>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.safe}>
        <View style={{ paddingTop: insets.top }}>
          <HeaderTitle title="Ruta" subtitle="No se encontró el detalle" tone="light" />
        </View>
        <View style={styles.missing}>
          <Text style={styles.missingTitle}>Sin datos</Text>
          <Text style={styles.missingSub}>
            {error ?? "No se pudo cargar esta ruta."}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => void refresh()}
            activeOpacity={0.85}
          >
            <Text style={styles.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
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
  const badgeTone = statusBadgeTone(route.status);
  const whenLabel = formatWhen(route.createdAtCdmx);
  const statusDotScale = statusDotPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });
  const pickupSwipeHint =
    confirmProgress && !confirmProgress.allConfirmed
      ? "Desliza para iniciar conteo"
      : "Desliza para verificar vehículo";

  return (
    <View style={styles.safe}>
      <View
        style={styles.mapLayer}
        pointerEvents={Platform.OS === "android" ? "none" : "box-none"}
      >
        <DriverRouteTripMapWebView
          model={mapModel}
          fill
          interactive={Platform.OS === "ios"}
          fitPadding={mapFitPadding}
          celebrationMode={false}
          mapFitOptions={
            isCompleta
              ? {
                  maxZoom: 15,
                  minZoom: 12,
                  zoomBoost: false,
                  zoomOut: MAP_FIT_ZOOM_OUT,
                  animateDraw: false,
                  strokeColor: "#10B981",
                  panUp: 100,
                }
              : {
                  maxZoom: 16,
                  minZoom: 12,
                  zoomBoost: false,
                  zoomOut: MAP_FIT_ZOOM_OUT,
                  animateDraw: true,
                  strokeColor: "#EA7600",
                  panUp: 88,
                }
          }
        />
        {isCompleta ? <DriverRouteConfettiLayer active pieceCount={16} fallDistance={420} /> : null}
      </View>

      <ScrollView
        style={styles.scrollOverlay}
        pointerEvents={Platform.OS === "android" ? "auto" : "box-none"}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS !== "android"}
        contentContainerStyle={{ paddingBottom: dockHeight + 24 }}
      >
        <View style={{ height: mapSpacerHeight }} />

        <Animated.View
          style={{
            opacity: sheetOpacity,
            transform: [{ translateY: sheetSlide }],
          }}
        >
          <RouteGlassPanel
            style={styles.statusSheetShadow}
            contentStyle={styles.statusSheetInner}
          >
            <DriverRouteStatusCard
              routeComplete={isCompleta}
              routeInProcess={isEnProceso}
              deliveredStopCount={stopDeliveryCounts.delivered}
              totalStopCount={routeOrderDestinations.length}
              progressSteps={routeProgressSteps}
              progressAccentColor={routeProgressAccent}
            />

            <View style={styles.sheetMetaRow}>
              <Text style={styles.sheetSubtitle}>
                {statusSubline(
                  route.status,
                  routeOrderDestinations.length,
                  totalUnits,
                  whenLabel,
                )}
              </Text>
              <View style={[styles.statusBadge, { borderColor: badgeTone.borderColor }]}>
                {isEnProceso ? (
                  <Animated.View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: badgeTone.dotColor,
                        transform: [{ scale: statusDotScale }],
                      },
                    ]}
                  />
                ) : (
                  <View style={[styles.statusDot, { backgroundColor: badgeTone.dotColor }]} />
                )}
                <Text style={[styles.statusTxt, { color: badgeTone.textColor }]}>
                  {statusLabel}
                </Text>
              </View>
            </View>

            <Text style={styles.sheetWhen}>{whenLabel}</Text>

            {vehicleLine ? (
              <View style={styles.infoRow}>
                <InfoPill
                  icon={<Car size={16} color={C.gris} variant="Bold" />}
                  text={vehicleLine}
                />
              </View>
            ) : null}
          </RouteGlassPanel>
        </Animated.View>

        <Animated.View
          style={{
            opacity: detailsOpacity,
            transform: [{ translateY: detailsSlide }],
            ...styles.detailsSection,
          }}
        >
          <RouteGlassPanel
            style={styles.deliveriesSheetShadow}
            contentStyle={styles.deliveriesSheetInner}
          >
            <View style={styles.deliveriesHeader}>
              <Text style={styles.detailsTitle}>Envíos y traspasos</Text>
              <Text style={styles.deliveriesCount}>
                {routeOrderDestinations.length}{" "}
                {routeOrderDestinations.length === 1 ? "registro" : "registros"}
              </Text>
            </View>

            <View style={styles.deliveryCards}>
              {routeOrderDestinations.map((dest, index) => (
                <DriverRouteGlassDeliveryCard
                  key={dest.id}
                  destination={dest}
                  displayNum={index + 1}
                  originLabel={route.originWarehouseName}
                  routeInProcess={isEnProceso}
                  routeComplete={isCompleta}
                  productsCollapsed={productsCollapsedByDestId[dest.id] ?? true}
                  onToggleProducts={() => toggleProducts(dest.id)}
                />
              ))}
            </View>

            {isCompleta ? <DriverRouteDetailAuditCards detail={detail} embedded /> : null}
          </RouteGlassPanel>
        </Animated.View>
      </ScrollView>

      <View
        style={[styles.fixedHeader, { paddingTop: insets.top + 2 }]}
        pointerEvents="box-none"
        collapsable={false}
      >
        <HeaderTitle
          title="Mi ruta"
          subtitle={route.folio}
          tone="light"
          overlayOnMap
          backgroundColor="transparent"
        />
      </View>

      {showPickupDock ? (
        <View
          style={[styles.pickupDock, { paddingBottom: dockBottomPad }]}
          pointerEvents="box-none"
        >
          <SlideToStartAudit
            inDock
            hintText={pickupSwipeHint}
            onSlideComplete={goPickup}
            busy={false}
          />
        </View>
      ) : null}

      {showNavDock ? (
        <View
          style={[styles.pickupDock, { paddingBottom: dockBottomPad }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.dockBtn}
            onPress={goNavDeliveries}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Continuar entregas"
          >
            <Text style={styles.dockBtnTxt}>Continuar entregas</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.crema,
  },
  scrollOverlay: {
    flex: 1,
    zIndex: 2,
    elevation: Platform.OS === "android" ? 12 : 2,
    backgroundColor: "transparent",
  },
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    elevation: 0,
  },
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 4,
    elevation: 24,
  },
  deliveriesSheetShadow: {
    marginHorizontal: 16,
  },
  statusSheetShadow: {
    marginHorizontal: 16,
  },
  statusSheetInner: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },
  sheetMetaRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  sheetSubtitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "500",
    color: C.corteza,
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusTxt: {
    fontSize: 11,
    fontWeight: "800",
  },
  sheetWhen: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: C.gris,
    textTransform: "capitalize",
  },
  infoRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
    gap: 10,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(105, 97, 88, 0.06)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoPillTxt: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: C.ink,
    lineHeight: 18,
  },
  deliveriesSheetInner: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },
  deliveriesHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  deliveriesCount: {
    fontSize: 12,
    fontWeight: "700",
    color: C.gris,
  },
  deliveryCards: {
    gap: 10,
  },
  detailsSection: {
    paddingTop: 14,
    paddingBottom: 32,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  pickupDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "transparent",
    zIndex: 4,
    ...Platform.select({ android: { elevation: 24 } }),
  },
  dockBtn: {
    height: 56,
    borderRadius: 999,
    backgroundColor: C.naranja,
    alignItems: "center",
    justifyContent: "center",
  },
  dockBtnTxt: {
    color: C.white,
    fontSize: 16,
    fontWeight: "800",
  },
  missing: {
    padding: 24,
  },
  missingTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.ink,
  },
  missingSub: {
    marginTop: 8,
    fontSize: 14,
    color: C.gris,
    lineHeight: 20,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  retryBtn: {
    marginTop: 16,
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
});
