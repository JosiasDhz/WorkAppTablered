import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Car, Clock, Profile2User, Tag } from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SlideToStartAudit } from "../../components/SlideToStartAudit";
import type { RootStackParamList } from "../../routes/RootStackParamList";
import { driverRouteStatusLabelEs } from "../../domain/driverRoutePending";
import { getDriverRouteAssignmentDetail } from "./driverDemo/resolveDriverRouteAssignmentDetail";
import { tripMapModelFromAssignment } from "./driverRoute/tripMapModelFromAssignment";
import type { MapFitPadding } from "./driverRoute/driverRouteTripGoogleMapHtml";
import { DriverRouteTripMapWebView } from "./driverRoute/DriverRouteTripMapWebView";
import { DriverRouteStopsList } from "./driverRoute/DriverRouteStopsList";
import { destinationsInRouteTravelOrder } from "./driverRoute/driverRouteDestinationsTravelOrder";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
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

function TripFieldRow({
  icon,
  label,
  value,
  hint,
  divider,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string | null;
  divider?: boolean;
}) {
  return (
    <View style={[styles.fieldRow, divider ? styles.fieldRowDivider : null]}>
      <View style={styles.fieldIconWrap}>{icon}</View>
      <View style={styles.fieldBody}>
        <Text style={styles.fieldLbl}>{label}</Text>
        <Text style={styles.fieldVal}>{value}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
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
  const detail = useMemo(() => getDriverRouteAssignmentDetail(routeId), [routeId]);
  const mapModel = useMemo(
    () => (detail ? tripMapModelFromAssignment(detail) : { path: [], stops: [] }),
    [detail],
  );

  const routeOrderDestinations = useMemo(
    () => (detail ? destinationsInRouteTravelOrder(detail) : []),
    [detail],
  );
  const firstDest = routeOrderDestinations[0];
  const vehicle = firstDest?.vehicle;
  const driver = firstDest?.assignedDriver;

  if (!detail) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <LinearGradient
          colors={["#E2E8F0", "#F8FAFC"]}
          style={StyleSheet.absoluteFillObject}
        />
        <HeaderTitle
          title="Ruta"
          subtitle="No se encontró el detalle"
          tone="light"
        />
        <View style={styles.missing}>
          <Text style={styles.missingTitle}>Sin datos</Text>
          <Text style={styles.missingSub}>
            Conecta el API o abre una ruta válida. En demo solo aplica a la ruta de ejemplo.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { route } = detail;
  const vehicleLine = vehicle
    ? `${vehicle.model} · ${vehicle.plateNumber} (${vehicle.type})`
    : "";
  const statusLabel = driverRouteStatusLabelEs(route.status);

  const goPickup = useCallback(async () => {
    navigation.navigate("DriverRouteProductPickup", { routeId: route.id });
  }, [navigation, route.id]);

  const dockBottomPad = Math.max(insets.bottom, 12);
  const swipeDockH = 88 + dockBottomPad;
  const sheetMaxH = Math.round(winH * 0.48);
  const scrollMaxH = Math.max(200, sheetMaxH);

  const detailMapFitPadding = useMemo((): MapFitPadding => {
    return {
      top: Math.round(insets.top) + 112,
      right: 16,
      bottom: sheetMaxH + Math.round(swipeDockH * 0.45),
      left: 14,
    };
  }, [insets.top, sheetMaxH, swipeDockH]);

  const scrollPadBottom = swipeDockH + 12;

  const scrollYRef = useRef(0);
  const sectionYRef = useRef<number | null>(null);
  const scrollVHRef = useRef(0);
  const contentHRef = useRef(0);
  const dockOpacity = useRef(new Animated.Value(0)).current;
  const interactiveRef = useRef(false);
  const [dockPointerEvents, setDockPointerEvents] = useState<"none" | "auto">("none");

  const applyDockOpacity = useCallback(() => {
    const sectionY = sectionYRef.current;
    const vy = scrollVHRef.current;
    const ch = contentHRef.current;
    if (vy <= 0) return;
    let t = 0;
    if (sectionY != null) {
      const y = scrollYRef.current;
      const maxScroll = Math.max(0, ch - vy);
      const bottom = y + vy;
      const fadeStart = sectionY + 36;
      const fadeEnd = sectionY + 140;
      const zone = Math.min(1, Math.max(0, (bottom - fadeStart) / (fadeEnd - fadeStart)));
      const scrollGate =
        maxScroll <= 6 ? 1 : y < 6 ? 0 : Math.min(1, (y - 6) / 96);
      t = zone * scrollGate;
    }
    dockOpacity.setValue(t);
    const next = t > 0.14;
    if (next !== interactiveRef.current) {
      interactiveRef.current = next;
      setDockPointerEvents(next ? "auto" : "none");
    }
  }, [dockOpacity]);

  const onSheetScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollYRef.current = e.nativeEvent.contentOffset.y;
      applyDockOpacity();
    },
    [applyDockOpacity],
  );

  return (
    <View style={styles.screenRoot}>
      <View style={styles.mapLayer} accessibilityLabel="Mapa del recorrido">
        <DriverRouteTripMapWebView
          model={mapModel}
          fill
          fitPadding={detailMapFitPadding}
        />
      </View>
      <View style={styles.overlayColumn} pointerEvents="box-none">
        <View style={[styles.headerBar, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={["rgba(248,250,252,0.98)", "rgba(248,250,252,0.72)", "rgba(248,250,252,0)"]}
            style={styles.headerGradient}
            pointerEvents="none"
          />
          <HeaderTitle
            title={route.folio}
            subtitle={`Origen · ${route.originWarehouseName}`}
            tone="light"
            backgroundColor="transparent"
          />
        </View>
        <View style={styles.flexSpacer} pointerEvents="box-none" />
        <View style={[styles.bottomSheet, { maxHeight: sheetMaxH }]} pointerEvents="auto">
          <ScrollView
            style={[styles.sheetScroll, { maxHeight: scrollMaxH }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            scrollEventThrottle={16}
            onScroll={onSheetScroll}
            onLayout={(e) => {
              scrollVHRef.current = e.nativeEvent.layout.height;
              applyDockOpacity();
            }}
            onContentSizeChange={(_, h) => {
              contentHRef.current = h;
              applyDockOpacity();
            }}
            contentContainerStyle={[
              styles.sheetScrollContent,
              { paddingBottom: scrollPadBottom, paddingTop: 10 },
            ]}
          >
            <View style={styles.tripCard}>
              <View style={styles.tripCardHead}>
                <View style={styles.tripCardAccent} />
                <Text style={styles.tripCardTitle}>Datos del viaje</Text>
              </View>
              <TripFieldRow
                icon={<Tag size={16} color="#64748B" variant="Bold" />}
                label="Estatus"
                value={statusLabel}
                divider
              />
              <TripFieldRow
                icon={<Clock size={16} color="#64748B" variant="Bold" />}
                label="Última actualización"
                value={formatWhen(route.lastUpdatedAtCdmx)}
                hint={route.lastUpdatedByWorkerName ?? undefined}
                divider={Boolean(driver || vehicleLine)}
              />
              {driver ? (
                <TripFieldRow
                  icon={<Profile2User size={16} color="#64748B" variant="Bold" />}
                  label="Chofer"
                  value={driverFullName(driver)}
                  divider={Boolean(vehicleLine)}
                />
              ) : null}
              {vehicleLine ? (
                <TripFieldRow
                  icon={<Car size={16} color="#64748B" variant="Bold" />}
                  label="Vehículo"
                  value={vehicleLine}
                />
              ) : null}
            </View>

            <View
              onLayout={(e) => {
                sectionYRef.current = e.nativeEvent.layout.y;
                applyDockOpacity();
              }}
            >
              <View style={[styles.sectionHead, styles.sectionHeadSpaced]}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Entregas programadas</Text>
              </View>
              <DriverRouteStopsList destinations={routeOrderDestinations} />
            </View>
          </ScrollView>
        </View>
        <Animated.View
          style={[styles.pickupDock, { paddingBottom: dockBottomPad, opacity: dockOpacity }]}
          pointerEvents={dockPointerEvents}
          accessibilityLabel="Desliza para comenzar el conteo de levantamiento"
        >
          <SlideToStartAudit
            inDock
            hintText="Desliza para comenzar el conteo"
            onSlideComplete={goPickup}
            busy={false}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayColumn: {
    flex: 1,
    zIndex: 1,
    position: "relative",
  },
  pickupDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "transparent",
    ...Platform.select({
      android: { elevation: 28 },
    }),
  },
  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  flexSpacer: {
    flex: 1,
  },
  bottomSheet: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.22,
        shadowRadius: 28,
      },
      android: { elevation: 20 },
    }),
  },
  sheetScroll: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
  },
  sheetScrollContent: {
    paddingHorizontal: 16,
  },
  safe: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  sectionHeadSpaced: {
    marginTop: 10,
  },
  sectionAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#EA580C",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  tripCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8ECEF",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
      },
      android: { elevation: 8 },
    }),
  },
  tripCardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#FAFBFC",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  tripCardAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: "#EA580C",
  },
  tripCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  fieldRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEF2F6",
  },
  fieldIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldBody: {
    flex: 1,
    minWidth: 0,
  },
  fieldLbl: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  fieldVal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: 19,
  },
  fieldHint: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  missing: {
    padding: 24,
  },
  missingTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  missingSub: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
});
