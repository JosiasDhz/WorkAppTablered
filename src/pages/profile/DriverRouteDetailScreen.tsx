import React, { useCallback, useEffect, useMemo, useRef } from "react";
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
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Car, Profile2User } from "iconsax-react-native";
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
import { DriverRouteCompletedDetailBadge } from "./driverRoute/DriverRouteCompletedDetailBadge";
import { DriverRouteConfettiLayer } from "./driverRoute/DriverRouteConfettiLayer";
import { DriverRouteDetailAuditCards } from "./driverRoute/DriverRouteDetailAuditCards";
import { DriverRouteInProgressDetailBadge } from "./driverRoute/DriverRouteInProgressDetailBadge";
import { DriverRouteDetailTripRows } from "./driverRoute/DriverRouteDetailTripRows";
import { destinationsInRouteTravelOrder } from "./driverRoute/driverRouteDestinationsTravelOrder";
import { TableRedColors } from "../../theme/tableRedColors";

const C = TableRedColors;

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

function driverFullName(d: {
  name: string;
  lastName: string;
  secondLastName: string | null;
}): string {
  return [d.name, d.lastName, d.secondLastName].filter(Boolean).join(" ").trim();
}

function statusBadgeTone(status: string): {
  borderColor: string;
  dotColor: string;
  textColor: string;
} {
  if (status === "EN_PROCESO") {
    return { borderColor: C.naranja, dotColor: C.naranja, textColor: C.naranja };
  }
  if (status === "LEVANTAMIENTO") {
    return { borderColor: C.naranja, dotColor: C.naranja, textColor: C.naranja };
  }
  if (status === "CONFIRMADA" || status === "COMPLETA") {
    return { borderColor: C.verde, dotColor: C.verdeHover, textColor: C.verdeHover };
  }
  return { borderColor: C.azul, dotColor: C.azul, textColor: C.azul };
}

function statusHeadline(status: string): string {
  if (status === "COMPLETA") return "Ruta completada";
  if (status === "EN_PROCESO") return "Entregas en curso";
  if (status === "LEVANTAMIENTO") return "Verificación del vehículo";
  if (status === "CONFIRMADA") return "Ruta lista para salir";
  return "Ruta pendiente";
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

function canShowPickupDock(status: string): boolean {
  return (
    status !== "EN_PROCESO" &&
    status !== "COMPLETA" &&
    status !== "CANCELADA"
  );
}

function statusProgress(status: string): number {
  if (status === "COMPLETA") return 1;
  if (status === "EN_PROCESO") return 0.88;
  if (status === "LEVANTAMIENTO") return 0.75;
  if (status === "CONFIRMADA") return 0.62;
  return 0.34;
}

function isDeliveredStopRecord(status: string): boolean {
  const s = status.trim().toUpperCase();
  return s === "ENTREGADO" || s === "ENTREGADO_CHOFER";
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

const SHEET_ESTIMATE_HEIGHT = 172;
const PICKUP_SWIPE_DOCK_HEIGHT = 88;

function RouteGlassCard(props: {
  children: React.ReactNode;
  paddingBottom?: number;
}) {
  const { children, paddingBottom = 18 } = props;
  return (
    <View style={styles.floatingSheetShadow}>
      <View style={styles.floatingSheetWrap}>
        <BlurView
          intensity={Platform.OS === "ios" ? 58 : 72}
          tint="light"
          {...(Platform.OS === "android"
            ? {
                experimentalBlurMethod: "dimezisBlurView" as const,
                blurReductionFactor: 2,
              }
            : {})}
          style={[
            styles.floatingSheetBlur,
            {
              backgroundColor:
                Platform.OS === "ios"
                  ? "rgba(255, 255, 255, 0.48)"
                  : "rgba(255, 255, 255, 0.52)",
            },
          ]}
        >
          <View style={[styles.floatingSheetInner, { paddingBottom }]}>
            {children}
          </View>
        </BlurView>
      </View>
    </View>
  );
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

  const mapSpacerHeight = Math.max(
    Math.round(insets.top + 120),
    Math.round(winH - dockHeight - SHEET_ESTIMATE_HEIGHT + 8),
  );

  const mapFitPadding = useMemo(
    () => ({
      top: 90,
      right: 40,
      bottom: Math.round(dockHeight + SHEET_ESTIMATE_HEIGHT + 10),
      left: 40,
    }),
    [dockHeight],
  );

  const isCompleta = routeStatus === "COMPLETA";
  const isEnProceso = routeStatus === "EN_PROCESO";
  const progressTarget = detail ? statusProgress(detail.route.status) : 0;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressPulse = useRef(new Animated.Value(0)).current;
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
      const done = dest.records.some((rec) =>
        isDeliveredStopRecord(String(rec.deliveryStatus ?? "")),
      );
      if (done) delivered += 1;
      else pending += 1;
    }
    return { delivered, pending };
  }, [detail, routeOrderDestinations]);

  useEffect(() => {
    if (!detail) return;
    progressAnim.setValue(0);
    sheetOpacity.setValue(0);
    sheetSlide.setValue(28);
    detailsOpacity.setValue(0);
    detailsSlide.setValue(20);

    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: progressTarget,
        duration: isCompleta ? 1500 : 820,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
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
    progressAnim,
    progressTarget,
    sheetOpacity,
    sheetSlide,
  ]);

  useEffect(() => {
    if (!isEnProceso) return;
    const progressLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(progressPulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(progressPulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );
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
    progressLoop.start();
    dotLoop.start();
    return () => {
      progressLoop.stop();
      dotLoop.stop();
    };
  }, [isEnProceso, progressPulse, statusDotPulse]);

  useEffect(() => {
    if (!isCompleta || completaFxPlayedRef.current) return;
    completaFxPlayedRef.current = true;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [isCompleta]);

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
  const driver = firstDest?.assignedDriver;
  const vehicleLine = vehicle
    ? `${vehicle.model} · ${vehicle.plateNumber}`
    : "";
  const statusLabel = driverRouteStatusLabelEs(route.status);
  const badgeTone = statusBadgeTone(route.status);
  const whenLabel = formatWhen(route.createdAtCdmx);
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });
  const progressGlowOpacity = progressPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });
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
      <View style={styles.mapLayer} pointerEvents="box-none">
        <DriverRouteTripMapWebView
          model={mapModel}
          fill
          fitPadding={mapFitPadding}
          celebrationMode={isCompleta}
          mapFitOptions={
            isCompleta
              ? undefined
              : { maxZoom: 16, zoomBoost: false, animateDraw: true }
          }
        />
        {isEnProceso ? (
          <View
            style={[styles.completedBadgeWrap, { top: insets.top + 78 }]}
            pointerEvents="none"
          >
            <DriverRouteInProgressDetailBadge
              deliveredStops={stopDeliveryCounts.delivered}
              pendingStops={stopDeliveryCounts.pending}
            />
          </View>
        ) : null}
        {isCompleta ? (
          <View
            style={[styles.completedBadgeWrap, { top: insets.top + 78 }]}
            pointerEvents="none"
          >
            <DriverRouteCompletedDetailBadge stopCount={routeOrderDestinations.length} />
          </View>
        ) : null}
        {isCompleta ? <DriverRouteConfettiLayer active pieceCount={16} fallDistance={420} /> : null}
      </View>

      <ScrollView
        style={styles.scrollOverlay}
        pointerEvents="box-none"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: dockHeight + 24 }}
      >
        <View style={{ height: mapSpacerHeight }} pointerEvents="none" />

        <Animated.View
          style={{
            opacity: sheetOpacity,
            transform: [{ translateY: sheetSlide }],
          }}
        >
          <RouteGlassCard>
            <View style={styles.sheetTop}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.sheetTitle}>
                  {statusHeadline(route.status)}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {statusSubline(
                    route.status,
                    routeOrderDestinations.length,
                    totalUnits,
                    whenLabel,
                  )}
                </Text>
              </View>
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

            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressWidth,
                    backgroundColor: isCompleta ? C.verdeHover : C.naranja,
                    opacity: isEnProceso ? progressGlowOpacity : 1,
                  },
                ]}
              />
            </View>

            <Text style={styles.sheetWhen}>{whenLabel}</Text>
          </RouteGlassCard>
        </Animated.View>

        <Animated.View
          style={{
            opacity: detailsOpacity,
            transform: [{ translateY: detailsSlide }],
            ...styles.detailsSection,
          }}
        >
          <RouteGlassCard paddingBottom={20}>
            <Text style={styles.detailsTitle}>Detalle del recorrido</Text>
            <DriverRouteDetailTripRows
              embedded
              originName={route.originWarehouseName}
              destinations={routeOrderDestinations}
            />

            {driver || vehicleLine ? (
              <View style={styles.infoRow}>
                {driver ? (
                  <InfoPill
                    icon={<Profile2User size={16} color={C.gris} variant="Bold" />}
                    text={driverFullName(driver)}
                  />
                ) : null}
                {vehicleLine ? (
                  <InfoPill
                    icon={<Car size={16} color={C.gris} variant="Bold" />}
                    text={vehicleLine}
                  />
                ) : null}
              </View>
            ) : null}

            {isCompleta ? <DriverRouteDetailAuditCards detail={detail} embedded /> : null}
          </RouteGlassCard>
        </Animated.View>
      </ScrollView>

      <View
        style={[styles.fixedHeader, { paddingTop: insets.top + 2 }]}
        pointerEvents="box-none"
      >
        <HeaderTitle
          title={route.folio}
          subtitle={`Origen · ${route.originWarehouseName}`}
          tone="light"
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
    backgroundColor: "transparent",
  },
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  completedBadgeWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2,
  },
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  floatingSheetShadow: {
    marginHorizontal: 16,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: C.marron,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.24,
        shadowRadius: 28,
      },
      android: { elevation: 18 },
      default: {},
    }),
  },
  floatingSheetWrap: {
    borderRadius: 24,
    overflow: "hidden",
  },
  floatingSheetBlur: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.72)",
  },
  floatingSheetInner: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },
  sheetTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  sheetSubtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "500",
    color: C.corteza,
    lineHeight: 20,
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
  progressTrack: {
    marginTop: 18,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(162, 171, 182, 0.28)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    minWidth: 12,
  },
  sheetWhen: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "600",
    color: C.gris,
    textTransform: "capitalize",
  },
  detailsSection: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -0.3,
    lineHeight: 28,
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
