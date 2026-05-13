import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Location, Map1, ArrowLeft3, ArrowRight3, ArrowUp2, ArrowRotateLeft, ArrowRotateRight } from "iconsax-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CommonActions, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import SignatureScreen, { type SignatureViewRef } from "react-native-signature-canvas";
import Toast from "react-native-toast-message";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SlideToStartAudit } from "../../components/SlideToStartAudit";
import type { RootStackParamList } from "../../routes/RootStackParamList";
import { getDriverRouteAssignmentDetail } from "./driverDemo/resolveDriverRouteAssignmentDetail";
import { destinationsInRouteTravelOrder } from "./driverRoute/driverRouteDestinationsTravelOrder";
import type { MapFitPadding } from "./driverRoute/driverRouteTripGoogleMapHtml";
import { tripMapModelLegToStopAtIndex } from "./driverRoute/tripMapModelLegToStopAtIndex";
import {
  DriverRouteNavLiveMapWebView,
  type DriverRouteNavLiveMapWebViewRef,
} from "./driverRoute/DriverRouteNavLiveMapWebView";
import { useLiveLegNavigation } from "./driverRoute/useLiveLegNavigation";
import type { NavTurnKind } from "./driverRoute/resolveNavTurnKind";

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

const signatureWebStyle = `.m-signature-pad--footer {display: none; margin: 0;} .m-signature-pad {box-shadow: none; border: none;}`;

function NavTurnGlyph({ kind }: { kind: NavTurnKind }) {
  const color = "#ffffff";
  const size = 42;
  switch (kind) {
    case "left":
      return <ArrowLeft3 size={size} color={color} variant="Bold" />;
    case "slight-left":
      return (
        <View style={navTurnStyles.tiltLeft}>
          <ArrowLeft3 size={size} color={color} variant="Bold" />
        </View>
      );
    case "right":
      return <ArrowRight3 size={size} color={color} variant="Bold" />;
    case "slight-right":
      return (
        <View style={navTurnStyles.tiltRight}>
          <ArrowRight3 size={size} color={color} variant="Bold" />
        </View>
      );
    case "straight":
    case "merge":
      return <ArrowUp2 size={size} color={color} variant="Bold" />;
    case "uturn":
      return <ArrowRotateLeft size={size} color={color} variant="Bold" />;
    case "roundabout-left":
      return <ArrowRotateLeft size={size} color={color} variant="Bold" />;
    case "roundabout-right":
      return <ArrowRotateRight size={size} color={color} variant="Bold" />;
    default:
      return null;
  }
}

const navTurnStyles = StyleSheet.create({
  tiltLeft: { transform: [{ rotate: "-26deg" }] },
  tiltRight: { transform: [{ rotate: "26deg" }] },
});

type DeliveryFlow = "start_slide" | "signature" | "finalize_slide";

export default function DriverRouteNavFirstStopScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { height: winH } = useWindowDimensions();
  const mapRef = useRef<DriverRouteNavLiveMapWebViewRef>(null);
  const sigRef = useRef<SignatureViewRef | null>(null);
  const { params } = useRoute<RouteProp<RootStackParamList, "DriverRouteNavFirstStop">>();
  const routeId = params?.routeId ?? "";
  const detail = useMemo(() => getDriverRouteAssignmentDetail(routeId), [routeId]);

  const ordered = useMemo(
    () => (detail ? destinationsInRouteTravelOrder(detail) : []),
    [detail],
  );
  const [stopIdx, setStopIdx] = useState(0);
  const [flow, setFlow] = useState<DeliveryFlow>("start_slide");
  const [finalizeSlideBusy, setFinalizeSlideBusy] = useState(false);

  const current = ordered[stopIdx];
  const currentRec = current?.records[0];

  const navModel = useMemo(
    () => (detail ? tripMapModelLegToStopAtIndex(detail, stopIdx) : { path: [], stops: [] }),
    [detail, stopIdx],
  );

  const live = useLiveLegNavigation(
    GOOGLE_KEY,
    currentRec?.latitude ?? Number.NaN,
    currentRec?.longitude ?? Number.NaN,
    navModel.path,
  );

  const mapModel = useMemo(
    () => ({ path: live.effectivePath, stops: navModel.stops }),
    [live.effectivePath, navModel.stops],
  );

  const fitPadding = useMemo((): MapFitPadding => {
    const navBannerTop = Math.round(insets.top) + 10;
    const navBannerBlock = 182;
    const topReserve = navBannerTop + navBannerBlock + 30;
    const bottomReserve = Math.round(winH * 0.44) + 96;
    return {
      top: topReserve,
      right: 18,
      bottom: Math.max(bottomReserve - 34, 318),
      left: 42,
    };
  }, [insets.top, winH]);

  const liveRef = useRef(live);
  liveRef.current = live;

  const mapVisualKey = useMemo(
    () => `${live.legPath.length >= 2 ? "dir" : "fb"}-${stopIdx}`,
    [live.legPath.length, stopIdx],
  );

  const hasUserFix = live.userLat != null && live.userLng != null;

  const pushPose = useCallback(() => {
    if (live.userLat == null || live.userLng == null) return;
    mapRef.current?.updateNavigation(live.userLat, live.userLng, live.headingDeg);
  }, [live.userLat, live.userLng, live.headingDeg]);

  const onCenterMyLocation = useCallback(() => {
    if (live.userLat == null || live.userLng == null) return;
    mapRef.current?.centerOnUser(live.userLat, live.userLng);
  }, [live.userLat, live.userLng]);

  const onFitRoute = useCallback(() => {
    mapRef.current?.fitRouteOverview();
  }, []);

  const applyUserBootstrap = useCallback(() => {
    const L = liveRef.current;
    if (L.userLat == null || L.userLng == null) return;
    mapRef.current?.bootstrapUserPose(L.userLat, L.userLng, L.headingDeg);
  }, []);

  const onMapWebViewLoadEnd = useCallback(() => {
    applyUserBootstrap();
  }, [applyUserBootstrap]);

  const onSwipeRealizarEntrega = useCallback(async () => {
    setFlow("signature");
  }, []);

  const closeSignatureModal = useCallback(() => {
    sigRef.current?.clearSignature?.();
    setFlow("start_slide");
  }, []);

  const requestReadSignature = useCallback(() => {
    sigRef.current?.readSignature?.();
  }, []);

  const onSignatureOk = useCallback((signature: string) => {
    if (!signature || signature.length < 120) {
      Toast.show({
        type: "error",
        text1: "Firma requerida",
        text2: "Pide al cliente que firme en el recuadro.",
      });
      return;
    }
    setFlow("finalize_slide");
  }, []);

  const onSignatureEmpty = useCallback(() => {
    Toast.show({
      type: "error",
      text1: "Firma vacía",
      text2: "Dibuja la firma antes de confirmar.",
    });
  }, []);

  const onSwipeFinalizarEntrega = useCallback(async () => {
    setFinalizeSlideBusy(true);
    try {
      const last = stopIdx >= ordered.length - 1;
      if (last) {
        Toast.show({
          type: "success",
          text1: "Ruta finalizada",
          text2: "Todas las entregas quedaron registradas.",
        });
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Tabs" }],
          }),
        );
        return;
      }
      setStopIdx((i) => i + 1);
      setFlow("start_slide");
      sigRef.current?.clearSignature?.();
      Toast.show({
        type: "success",
        text1: "Entrega registrada",
        text2: "Continúa hacia la siguiente parada.",
      });
    } finally {
      setFinalizeSlideBusy(false);
    }
  }, [navigation, ordered.length, stopIdx]);

  useEffect(() => {
    pushPose();
  }, [pushPose]);

  useEffect(() => {
    if (!detail) return;
    const cur = ordered[stopIdx];
    if (!cur?.records[0]) return;
    if (!hasUserFix) return;
    applyUserBootstrap();
    const t1 = setTimeout(applyUserBootstrap, 120);
    const t2 = setTimeout(applyUserBootstrap, 420);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [detail, ordered, stopIdx, mapVisualKey, hasUserFix, applyUserBootstrap]);

  if (!detail || !current || !currentRec) {
    return (
      <SafeAreaView style={styles.fallback} edges={["top", "left", "right"]}>
        <HeaderTitle title="Ruta" subtitle="Sin primera entrega" tone="light" />
      </SafeAreaView>
    );
  }

  const addrLine =
    [currentRec.street, currentRec.externalNumber, currentRec.neighborhood, currentRec.city]
      .filter(Boolean)
      .join(", ") || currentRec.mapSearchQuery;

  const mapKey = mapVisualKey;

  const stopSummary =
    ordered.length > 1
      ? `Parada ${current.visitOrder} · ${stopIdx + 1}/${ordered.length}`
      : `Parada ${current.visitOrder}`;

  return (
    <View style={styles.screenRoot}>
      <DriverRouteNavLiveMapWebView
        key={mapKey}
        ref={mapRef}
        model={mapModel}
        fitPadding={fitPadding}
        onMapLoaded={onMapWebViewLoadEnd}
      />
      {live.loadingDirections ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      ) : null}
      <View style={styles.overlayColumn} pointerEvents="box-none">
        <View style={[styles.navBanner, { marginTop: Math.round(insets.top) + 10 }]}>
          <View style={styles.navBannerRow}>
            {!live.arrived && (live.navTurnKind !== "unknown" || live.steps.length > 0) ? (
              <View
                style={styles.navTurnIconWrap}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
              >
                <NavTurnGlyph
                  kind={live.navTurnKind === "unknown" && live.steps.length > 0 ? "straight" : live.navTurnKind}
                />
              </View>
            ) : null}
            <View style={styles.navBannerTextCol}>
              <Text style={styles.bannerDist} accessibilityRole="header">
                {live.secondaryLine}
              </Text>
              <Text style={styles.bannerInstr} numberOfLines={3}>
                {live.primaryLine}
              </Text>
            </View>
          </View>
          {live.permissionDenied ? (
            <Text style={styles.bannerWarn}>
              Activa ubicación para ruta en vivo y el vehículo en el mapa.
            </Text>
          ) : null}
          {live.directionsFailed && !live.permissionDenied ? (
            <Text style={styles.bannerWarn}>
              No se obtuvo ruta paso a paso. El mapa muestra el trazo guardado. Revisa la API
              Directions en Google Cloud.
            </Text>
          ) : null}
        </View>
        <View style={styles.flexSpacer} pointerEvents="box-none" />
        <View
          style={[
            styles.mapFabColumn,
            { bottom: Math.max(insets.bottom, 14) + Math.round(winH * 0.34) + 46 },
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            style={({ pressed }) => [styles.mapFab, pressed && styles.mapFabPressed]}
            onPress={onFitRoute}
            accessibilityRole="button"
            accessibilityLabel="Ver ruta centrada en el mapa"
          >
            <Map1 size={22} color="#0F172A" variant="Bold" />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.mapFab,
              pressed && styles.mapFabPressed,
              (live.userLat == null || live.userLng == null) && styles.mapFabDisabled,
            ]}
            onPress={onCenterMyLocation}
            disabled={live.userLat == null || live.userLng == null}
            accessibilityRole="button"
            accessibilityLabel="Centrar mapa en mi ubicación"
          >
            <Location size={22} color="#0F172A" variant="Bold" />
          </Pressable>
        </View>
        <View pointerEvents="box-none">
          <View style={styles.navStatsBar}>
            <Text style={styles.navStatsText} numberOfLines={1}>
              {live.progressLine}
            </Text>
          </View>
          <View
            style={[styles.bottomCard, { paddingBottom: Math.max(insets.bottom, 14) }]}
            pointerEvents="auto"
          >
            <Text style={styles.kicker}>{stopSummary}</Text>
            <Text style={styles.addr} numberOfLines={3}>
              {addrLine}
            </Text>
            {flow === "start_slide" ? (
              <SlideToStartAudit
                key={`d-${stopIdx}-s`}
                inDock
                busy={false}
                onSlideComplete={onSwipeRealizarEntrega}
                hintText="Desliza para realizar entrega"
              />
            ) : null}
            {flow === "finalize_slide" ? (
              <SlideToStartAudit
                key={`d-${stopIdx}-f`}
                inDock
                busy={finalizeSlideBusy}
                onSlideComplete={onSwipeFinalizarEntrega}
                hintText="Desliza para finalizar entrega"
              />
            ) : null}
          </View>
        </View>
      </View>

      <Modal
        visible={flow === "signature"}
        animationType="slide"
        presentationStyle={Platform.OS === "ios" ? "pageSheet" : undefined}
        onRequestClose={closeSignatureModal}
      >
        <SafeAreaView style={styles.sigModalRoot} edges={["top", "left", "right"]}>
          <View style={styles.sigModalHead}>
            <View style={styles.sigModalHeadRow}>
              <Text style={styles.sigModalTitle}>Firma del cliente</Text>
              <TouchableOpacity
                onPress={() => sigRef.current?.clearSignature()}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Limpiar firma"
              >
                <Text style={styles.sigLimpiarText}>Limpiar</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sigModalSub}>
              Confirma que la entrega está correcta. El cliente firma en el recuadro.
            </Text>
          </View>
          <View style={styles.sigCanvasWrap}>
            <SignatureScreen
              ref={sigRef}
              webStyle={signatureWebStyle}
              onOK={onSignatureOk}
              onEmpty={onSignatureEmpty}
              descriptionText="Firma del cliente"
              clearText="Limpiar"
              confirmText=""
              autoClear={false}
            />
          </View>
          <View style={[styles.sigModalActions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={styles.sigGhostBtn}
              onPress={closeSignatureModal}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Volver sin firmar"
            >
              <Text style={styles.sigGhostBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sigPrimaryBtn}
              onPress={requestReadSignature}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Confirmar firma del cliente"
            >
              <Text style={styles.sigPrimaryBtnText}>Confirmar firma</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  screenRoot: {
    flex: 1,
    position: "relative",
    backgroundColor: "#0f172a",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.25)",
    zIndex: 5,
  },
  overlayColumn: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    pointerEvents: "box-none",
  },
  navBanner: {
    marginHorizontal: 14,
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  navBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  navTurnIconWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  navBannerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  bannerDist: {
    fontSize: 28,
    fontWeight: "900",
    color: "#f8fafc",
    letterSpacing: -0.8,
  },
  bannerInstr: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "700",
    color: "#e2e8f0",
    lineHeight: 22,
  },
  bannerWarn: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#fbbf24",
    lineHeight: 18,
  },
  flexSpacer: {
    flex: 1,
  },
  mapFabColumn: {
    position: "absolute",
    right: 14,
    zIndex: 12,
    gap: 10,
    alignItems: "center",
  },
  mapFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
    }),
  },
  mapFabPressed: {
    opacity: 0.88,
  },
  mapFabDisabled: {
    opacity: 0.42,
  },
  navStatsBar: {
    marginHorizontal: 0,
    backgroundColor: "#0a0a0a",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    zIndex: 10,
  },
  navStatsText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fafafa",
    letterSpacing: -0.3,
  },
  bottomCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: 18,
    paddingTop: 14,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }),
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EA580C",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  addr: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    lineHeight: 20,
    marginBottom: 4,
  },
  sigModalRoot: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  sigModalHead: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sigModalHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sigModalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  sigLimpiarText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#EA580C",
  },
  sigModalSub: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    lineHeight: 20,
  },
  sigCanvasWrap: {
    flex: 1,
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  sigModalActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sigGhostBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  sigGhostBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#475569",
  },
  sigPrimaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
  },
  sigPrimaryBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
