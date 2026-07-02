import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  ArrowLeft3,
  ArrowRight3,
  ArrowRotateLeft,
  ArrowRotateRight,
  ArrowUp2,
  Gps,
  Routing2,
} from "iconsax-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CommonActions, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import SignatureScreen, { type SignatureViewRef } from "react-native-signature-canvas";
import Toast from "react-native-toast-message";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SlideToStartAudit } from "../../components/SlideToStartAudit";
import type { RootStackParamList } from "../../routes/RootStackParamList";
import { useSessionWorkerCode } from "../../hooks/useSessionWorkerCode";
import {
  finalizeDeliveryRoute,
  handoverDeliveryRouteCash,
  markDeliveryRouteStopDelivered,
  uploadDeliveryRouteSignatureDataUrl,
  uploadDeliveryRouteVehicleEvidence,
} from "../../services/deliveryRoutesService";
import { getDriverRouteAssignmentDetail } from "./driverDemo/resolveDriverRouteAssignmentDetail";
import { DRIVER_ROUTES_DETAIL_USE_DEMO } from "./driverDemo/driverRoutesListDemoFlag";
import { useDriverRouteAssignmentDetail } from "./hooks/useDriverRouteAssignmentDetail";
import { destinationsInRouteTravelOrder } from "./driverRoute/driverRouteDestinationsTravelOrder";
import type { MapFitPadding } from "./driverRoute/driverRouteTripGoogleMapHtml";
import {
  DriverRouteNavLiveMapWebView,
  type DriverRouteNavLiveMapWebViewRef,
} from "./driverRoute/DriverRouteNavLiveMapWebView";
import { DriverRouteCompletionCelebration } from "./driverRoute/DriverRouteCompletionCelebration";
import { DriverRouteTripMapWebView } from "./driverRoute/DriverRouteTripMapWebView";
import { tripMapModelFromAssignment } from "./driverRoute/tripMapModelFromAssignment";
import { openGoogleMapsDrivingDirections } from "./driverRoute/openGoogleMapsDrivingDirections";
import type { NavTurnKind } from "./driverRoute/resolveNavTurnKind";
import { tripMapModelLegToStopAtIndex } from "./driverRoute/tripMapModelLegToStopAtIndex";
import type { TripMapStopMarker } from "./driverRoute/tripMapModelFromAssignment";
import { useLiveLegNavigation } from "./driverRoute/useLiveLegNavigation";
import { useStaticLegRouteMap } from "./driverRoute/useStaticLegRouteMap";
import { DriverRouteDeliveryCountPanel } from "./driverRoute/DriverRouteDeliveryCountPanel";
import { DriverRouteCashHandoverPanel } from "./driverRoute/DriverRouteCashHandoverPanel";
import {
  type DriverRouteDeliveryEvidencePhotosState,
} from "./driverRoute/DriverRouteDeliveryEvidencePhotos";
import { buildDriverRouteDeliveredPayload, firstDriverRouteStopInTransitIndex } from "../../domain/driverRouteConfirmLines";
import {
  buildDeliveryLinesFromDestination,
  buildDeliveryPaymentFromDestination,
  emptyRouteQtyMap,
  isDeliveryPaymentRequired,
  parseMoneyMxn,
} from "./driverRoute/deliveryLinesFromDestination";
import {
  DriverRouteVehicleCheckPhotos,
  isDriverRouteEndCloseCheckComplete,
  parseOdometerReading,
  type DriverRouteVehicleCheckPhotosState,
} from "./driverRoute/DriverRouteVehicleCheckPhotos";

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const signatureWebStyle = `.m-signature-pad--footer {display: none; margin: 0;} .m-signature-pad {box-shadow: none; border: none;}`;

type DeliveryFlow = "start_slide" | "delivery_count" | "signature" | "end_fuel";
type MapMode = "route" | "live";

function extractApiErrorMessage(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const resp = (e as { response?: { data?: { message?: unknown } } }).response;
    const msg = resp?.data?.message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg.map(String).join(", ");
    if ("message" in e && typeof (e as { message: unknown }).message === "string") {
      return (e as { message: string }).message;
    }
  }
  return "No se pudo completar la operación";
}

function NavTurnGlyph({ kind }: { kind: NavTurnKind }) {
  const color = "#0F172A";
  const size = 28;
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
      return <ArrowUp2 size={size} color={color} variant="Bold" />;
    case "uturn":
      return <ArrowRotateLeft size={size} color={color} variant="Bold" />;
    case "merge":
      return <ArrowRotateRight size={size} color={color} variant="Bold" />;
    default:
      return <ArrowUp2 size={size} color={color} variant="Bold" />;
  }
}

const navTurnStyles = StyleSheet.create({
  tiltLeft: { transform: [{ rotate: "-18deg" }] },
  tiltRight: { transform: [{ rotate: "18deg" }] },
});

export default function DriverRouteNavFirstStopScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const sessionWorkerCode = useSessionWorkerCode();
  const { height: winH } = useWindowDimensions();
  const liveMapRef = useRef<DriverRouteNavLiveMapWebViewRef | null>(null);
  const liveNavCameraStartedRef = useRef(false);
  const sigRef = useRef<SignatureViewRef | null>(null);
  const { params } = useRoute<RouteProp<RootStackParamList, "DriverRouteNavFirstStop">>();
  const routeId = params?.routeId ?? "";
  const { detail: apiDetail, loading, error, refresh } = useDriverRouteAssignmentDetail(routeId);
  const demoDetail = useMemo(
    () => (DRIVER_ROUTES_DETAIL_USE_DEMO ? getDriverRouteAssignmentDetail(routeId) : null),
    [routeId],
  );
  const detail = demoDetail ?? apiDetail;

  const ordered = useMemo(
    () => (detail ? destinationsInRouteTravelOrder(detail) : []),
    [detail],
  );
  const [stopIdx, setStopIdx] = useState(0);
  const stopInitRouteIdRef = useRef("");
  const [mapMode, setMapMode] = useState<MapMode>("route");
  const [liveMapReady, setLiveMapReady] = useState(false);
  const [flow, setFlow] = useState<DeliveryFlow>("start_slide");
  const [signatureBusy, setSignatureBusy] = useState(false);
  const [finalizeBusy, setFinalizeBusy] = useState(false);
  const [handoverBusy, setHandoverBusy] = useState(false);
  const [routeCelebration, setRouteCelebration] = useState<{
    folio: string;
    deliveredStops: number;
    mapModel: ReturnType<typeof tripMapModelFromAssignment>;
  } | null>(null);
  const [deliveredByRecordId, setDeliveredByRecordId] = useState<Record<string, string>>({});
  const [deliveryEvidencePhotos, setDeliveryEvidencePhotos] =
    useState<DriverRouteDeliveryEvidencePhotosState>([]);
  const [endVehiclePhotos, setEndVehiclePhotos] = useState<DriverRouteVehicleCheckPhotosState>({
    odometer: null,
    odometerReading: "",
    fuel: null,
  });
  const flowFade = useRef(new Animated.Value(1)).current;
  const flowSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    flowFade.setValue(0);
    flowSlide.setValue(18);
    Animated.parallel([
      Animated.timing(flowFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(flowSlide, {
        toValue: 0,
        friction: 8,
        tension: 78,
        useNativeDriver: true,
      }),
    ]).start();
  }, [flow, flowFade, flowSlide]);

  useEffect(() => {
    if (!detail || ordered.length === 0) return;
    if (stopInitRouteIdRef.current === routeId) return;
    stopInitRouteIdRef.current = routeId;
    setStopIdx(firstDriverRouteStopInTransitIndex(ordered));
    if (detail.route.status !== "COMPLETA") {
      setFlow("start_slide");
    }
  }, [detail, ordered, routeId]);

  useEffect(() => {
    if (!detail || ordered.length === 0 || routeCelebration) return;
    if (
      detail.route.status === "COMPLETA" &&
      detail.route.routeEndFuelEvidenceFileId
    ) {
      setRouteCelebration({
        folio: detail.route.folio,
        deliveredStops: ordered.length,
        mapModel: tripMapModelFromAssignment(detail),
      });
      return;
    }
    if (detail.route.status === "COMPLETA") {
      setFlow("end_fuel");
    }
  }, [detail, ordered, routeCelebration]);

  const current = ordered[stopIdx];
  const currentRec = current?.records[0];

  const deliveryLines = useMemo(
    () => (current ? buildDeliveryLinesFromDestination(current) : []),
    [current],
  );

  const deliveryPayment = useMemo(
    () => (current ? buildDeliveryPaymentFromDestination(current) : null),
    [current],
  );

  const [amountReceivedRaw, setAmountReceivedRaw] = useState("");

  const fallbackLeg = useMemo(
    () => (detail ? tripMapModelLegToStopAtIndex(detail, stopIdx) : { path: [], stops: [] }),
    [detail, stopIdx],
  );

  const stopMarker = useMemo((): TripMapStopMarker | null => {
    if (!current || !currentRec) return null;
    const addr =
      [currentRec.street, currentRec.externalNumber, currentRec.neighborhood, currentRec.city]
        .filter(Boolean)
        .join(", ") || currentRec.mapSearchQuery;
    return {
      latitude: currentRec.latitude,
      longitude: currentRec.longitude,
      color: current.pinColorHex || "#EA7600",
      visitOrder: current.visitOrder,
      label: addr || `Parada ${current.visitOrder}`,
    };
  }, [current, currentRec]);

  const staticRoute = useStaticLegRouteMap(
    GOOGLE_KEY,
    stopMarker,
    fallbackLeg.path,
    mapMode === "route" && !!stopMarker,
    stopIdx,
  );

  const liveNav = useLiveLegNavigation(
    GOOGLE_KEY,
    currentRec?.latitude ?? NaN,
    currentRec?.longitude ?? NaN,
    fallbackLeg.path,
    mapMode === "live" && !!currentRec,
  );

  const liveMapModel = useMemo(
    () => ({
      path: liveNav.effectivePath,
      stops: stopMarker ? [stopMarker] : [],
    }),
    [liveNav.effectivePath, stopMarker],
  );

  const isDeliveryFocus = flow !== "start_slide";

  const deliveryFocusScrollMaxH = useMemo(() => {
    const headerReserve = 88;
    const sigActionsReserve = flow === "signature" ? 170 : flow === "end_fuel" ? 88 : 0;
    return Math.max(
      winH -
        insets.top -
        Math.max(insets.bottom, 14) -
        headerReserve -
        sigActionsReserve -
        24,
      160,
    );
  }, [winH, insets.top, insets.bottom, flow]);

  const endFuelComplete = isDriverRouteEndCloseCheckComplete(endVehiclePhotos);
  const cashHandoverCompleted = Boolean(detail?.route.driverCashHandoverAtCdmx);
  const cashHandoverPendingMxn = Math.max(
    0,
    Number(detail?.route.driverCashPendingHandoverMxn) || 0,
  );
  const cashHandoverAmountMxn = cashHandoverCompleted
    ? Math.max(0, Number(detail?.route.driverCashHandoverAmountMxn) || 0)
    : cashHandoverPendingMxn;
  const canFinalizeRoute =
    endFuelComplete && (cashHandoverPendingMxn <= 0 || cashHandoverCompleted);

  const fitPadding = useMemo((): MapFitPadding => {
    const bottomSheetRatio = 0.34;
    const topReserve = Math.round(insets.top) + 10 + (mapMode === "live" ? 238 : 198);
    const bottomReserve = Math.max(insets.bottom, 14) + Math.round(winH * bottomSheetRatio) + 28;
    return {
      top: topReserve,
      right: 18,
      bottom: Math.max(bottomReserve - 118, 200),
      left: 42,
    };
  }, [insets.top, insets.bottom, winH, mapMode]);

  useEffect(() => {
    setMapMode("route");
    setLiveMapReady(false);
  }, [stopIdx]);

  useEffect(() => {
    setDeliveredByRecordId(emptyRouteQtyMap(deliveryLines.map((l) => l.recordId)));
    setDeliveryEvidencePhotos([]);
    setAmountReceivedRaw("");
  }, [stopIdx, deliveryLines]);

  useEffect(() => {
    setLiveMapReady(false);
  }, [mapMode]);

  const onToggleMapMode = useCallback(() => {
    if (mapMode === "route") {
      setMapMode("live");
      return;
    }
    if (liveNav.userLat == null || liveNav.userLng == null) return;
    liveMapRef.current?.centerOnUser(
      liveNav.userLat,
      liveNav.userLng,
      liveNav.headingDeg,
    );
  }, [mapMode, liveNav.userLat, liveNav.userLng, liveNav.headingDeg]);

  const onOpenGoogleMaps = useCallback(async () => {
    if (!currentRec) return;
    try {
      await openGoogleMapsDrivingDirections(currentRec.latitude, currentRec.longitude);
    } catch {
      Toast.show({
        type: "error",
        text1: "No se pudo abrir Google Maps",
        text2: "Verifica que la app esté instalada.",
      });
    }
  }, [currentRec]);

  useEffect(() => {
    liveNavCameraStartedRef.current = false;
  }, [stopIdx, mapMode]);

  useEffect(() => {
    if (!liveMapReady) {
      liveNavCameraStartedRef.current = false;
    }
  }, [liveMapReady]);

  const onLiveMapLoaded = useCallback(() => {
    setLiveMapReady(true);
  }, []);

  useEffect(() => {
    if (mapMode !== "live" || !liveMapReady) return;
    if (liveNav.effectivePath.length >= 2) {
      liveMapRef.current?.updateRoutePath(liveNav.effectivePath);
      if (liveNav.userLat != null && liveNav.userLng != null) {
        liveMapRef.current?.bootstrapUserPose(
          liveNav.userLat,
          liveNav.userLng,
          liveNav.headingDeg,
        );
      }
    }
  }, [
    mapMode,
    liveMapReady,
    liveNav.effectivePath,
    liveNav.userLat,
    liveNav.userLng,
    liveNav.headingDeg,
  ]);

  useEffect(() => {
    if (mapMode !== "live" || !liveMapReady) return;
    if (liveNav.userLat == null || liveNav.userLng == null) return;
    liveMapRef.current?.updateNavigation(
      liveNav.userLat,
      liveNav.userLng,
      liveNav.headingDeg,
    );
    if (!liveNavCameraStartedRef.current) {
      liveNavCameraStartedRef.current = true;
      liveMapRef.current?.bootstrapUserPose(
        liveNav.userLat,
        liveNav.userLng,
        liveNav.headingDeg,
      );
    }
  }, [mapMode, liveMapReady, liveNav.userLat, liveNav.userLng, liveNav.headingDeg]);

  const onSwipeRealizarEntrega = useCallback(async () => {
    setDeliveredByRecordId(emptyRouteQtyMap(deliveryLines.map((l) => l.recordId)));
    setDeliveryEvidencePhotos([]);
    setAmountReceivedRaw("");
    setFlow("delivery_count");
  }, [deliveryLines]);

  const onCancelDeliveryCount = useCallback(() => {
    setFlow("start_slide");
  }, []);

  const onContinueToSignature = useCallback(() => {
    setFlow("signature");
  }, []);

  const setDeliveredQty = useCallback((recordId: string, text: string) => {
    setDeliveredByRecordId((prev) => ({ ...prev, [recordId]: text }));
  }, []);

  const closeSignatureModal = useCallback(() => {
    sigRef.current?.clearSignature?.();
    setFlow("delivery_count");
  }, []);

  const requestReadSignature = useCallback(() => {
    sigRef.current?.readSignature?.();
  }, []);

  const completeDeliveryAfterSignature = useCallback(async (signatureDataUrl: string) => {
    setSignatureBusy(true);
    try {
      if (!current) return;
      if (!sessionWorkerCode) {
        Toast.show({
          type: "error",
          text1: "Código de trabajador no disponible",
          text2: "Cierra sesión y vuelve a entrar para continuar.",
        });
        return;
      }
      if (!DRIVER_ROUTES_DETAIL_USE_DEMO) {
        const evidenceFileIds = await Promise.all(
          deliveryEvidencePhotos.map((photo) =>
            uploadDeliveryRouteVehicleEvidence(photo).then((uploaded) => uploaded.id),
          ),
        );
        const deliveredPayload = buildDriverRouteDeliveredPayload(current.records);
        if (
          !deliveredPayload.cartItemDeliveryIds?.length &&
          !deliveredPayload.transferIds?.length
        ) {
          Toast.show({
            type: "error",
            text1: "Sin partidas para entregar",
            text2: "No se encontraron líneas válidas en esta parada.",
          });
          return;
        }
        let signaturePayload:
          | { signatureEvidenceFileId: string }
          | { signatureDataUrl: string };
        try {
          const uploadedSignature =
            await uploadDeliveryRouteSignatureDataUrl(signatureDataUrl);
          signaturePayload = { signatureEvidenceFileId: uploadedSignature.id };
        } catch {
          signaturePayload = { signatureDataUrl };
        }
        await markDeliveryRouteStopDelivered(routeId, {
          workerCode: sessionWorkerCode,
          ...deliveredPayload,
          ...(evidenceFileIds.length > 0 ? { evidenceFileIds } : {}),
          ...signaturePayload,
          ...(isDeliveryPaymentRequired(deliveryPayment)
            ? { cashCollectionReceivedMxn: parseMoneyMxn(amountReceivedRaw) }
            : {}),
        });
      }
      const last = stopIdx >= ordered.length - 1;
      if (last) {
        sigRef.current?.clearSignature?.();
        setFlow("end_fuel");
        if (!DRIVER_ROUTES_DETAIL_USE_DEMO) {
          await refresh();
        }
        return;
      }
      setStopIdx((i) => i + 1);
      sigRef.current?.clearSignature?.();
      setFlow("start_slide");
      if (!DRIVER_ROUTES_DETAIL_USE_DEMO) {
        await refresh();
      }
      Toast.show({
        type: "success",
        text1: "Entrega registrada",
        text2: "Continúa con la siguiente parada.",
      });
    } catch (e: unknown) {
      Toast.show({
        type: "error",
        text1: "No se pudo registrar la entrega",
        text2: extractApiErrorMessage(e),
      });
    } finally {
      setSignatureBusy(false);
    }
  }, [amountReceivedRaw, current, deliveryEvidencePhotos, deliveryPayment, ordered.length, refresh, routeId, sessionWorkerCode, stopIdx]);

  const confirmCashHandover = useCallback(async () => {
    if (!sessionWorkerCode || handoverBusy || cashHandoverCompleted) return;
    if (cashHandoverPendingMxn <= 0) return;
    setHandoverBusy(true);
    try {
      if (!DRIVER_ROUTES_DETAIL_USE_DEMO) {
        await handoverDeliveryRouteCash(routeId, { workerCode: sessionWorkerCode });
        await refresh();
      }
      Toast.show({
        type: "success",
        text1: "Entrega a caja registrada",
        text2: "Ya puedes finalizar la ruta.",
      });
    } catch (e: unknown) {
      Toast.show({
        type: "error",
        text1: "No se pudo registrar la entrega a caja",
        text2: extractApiErrorMessage(e),
      });
    } finally {
      setHandoverBusy(false);
    }
  }, [
    cashHandoverCompleted,
    cashHandoverPendingMxn,
    handoverBusy,
    refresh,
    routeId,
    sessionWorkerCode,
  ]);

  const finalizeRoute = useCallback(async () => {
    if (!canFinalizeRoute || finalizeBusy) return;
    if (!sessionWorkerCode) {
      Toast.show({
        type: "error",
        text1: "Código de trabajador no disponible",
        text2: "Cierra sesión y vuelve a entrar para continuar.",
      });
      return;
    }
    const odometerPhoto = endVehiclePhotos.odometer;
    const fuelPhoto = endVehiclePhotos.fuel;
    const odometerReading = parseOdometerReading(endVehiclePhotos.odometerReading);
    if (!odometerPhoto || !fuelPhoto || odometerReading == null) {
      Toast.show({
        type: "error",
        text1: "Faltan datos del cierre",
        text2: "Completa el kilometraje final, la foto del tacómetro y la del combustible.",
      });
      return;
    }
    setFinalizeBusy(true);
    try {
      if (!DRIVER_ROUTES_DETAIL_USE_DEMO) {
        const [odometerUploaded, fuelUploaded] = await Promise.all([
          uploadDeliveryRouteVehicleEvidence(odometerPhoto),
          uploadDeliveryRouteVehicleEvidence(fuelPhoto),
        ]);
        await finalizeDeliveryRoute(routeId, {
          workerCode: sessionWorkerCode,
          odometerReading,
          odometerEvidenceFileId: odometerUploaded.id,
          fuelEvidenceFileId: fuelUploaded.id,
        });
      }
      const celebrationFolio = detail?.route.folio ?? routeId;
      const celebrationMapModel = detail
        ? tripMapModelFromAssignment(detail)
        : { path: [], stops: [] };
      setRouteCelebration({
        folio: celebrationFolio,
        deliveredStops: ordered.length,
        mapModel: celebrationMapModel,
      });
      if (!DRIVER_ROUTES_DETAIL_USE_DEMO) {
        void refresh();
      }
    } catch (e: unknown) {
      Toast.show({
        type: "error",
        text1: "No se pudo finalizar la ruta",
        text2: extractApiErrorMessage(e),
      });
    } finally {
      setFinalizeBusy(false);
    }
  }, [
    canFinalizeRoute,
    detail,
    endVehiclePhotos,
    finalizeBusy,
    ordered.length,
    refresh,
    routeId,
    sessionWorkerCode,
  ]);

  const onSignatureOk = useCallback(
    (signature: string) => {
      if (!signature || signature.length < 120) {
        Toast.show({
          type: "error",
          text1: "Firma requerida",
          text2: "Pide al cliente que firme en el recuadro.",
        });
        return;
      }
      void completeDeliveryAfterSignature(signature);
    },
    [completeDeliveryAfterSignature],
  );

  const onSignatureEmpty = useCallback(() => {
    Toast.show({
      type: "error",
      text1: "Firma vacía",
      text2: "Dibuja la firma antes de confirmar.",
    });
  }, []);

  if (routeCelebration) {
    return (
      <DriverRouteCompletionCelebration
        folio={routeCelebration.folio}
        deliveredStops={routeCelebration.deliveredStops}
        mapModel={routeCelebration.mapModel}
        onFinish={() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                { name: "Tabs" },
                { name: "DriverRouteDetail", params: { routeId } },
              ],
            }),
          );
        }}
      />
    );
  }

  if (loading && !detail) {
    return (
      <SafeAreaView style={styles.fallback} edges={["top", "left", "right"]}>
        <HeaderTitle title="Ruta" subtitle="Cargando entregas…" tone="light" />
        <View style={styles.fallbackCenter}>
          <ActivityIndicator size="large" color="#EA7600" />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail || !current || !currentRec) {
    return (
      <SafeAreaView style={styles.fallback} edges={["top", "left", "right"]}>
        <HeaderTitle title="Ruta" subtitle="Sin entregas" tone="light" />
        <View style={styles.fallbackCenter}>
          <Text style={styles.fallbackMsg}>
            {error ?? "No se pudo cargar el detalle de la ruta."}
          </Text>
          <TouchableOpacity style={styles.fallbackRetry} onPress={() => void refresh()}>
            <Text style={styles.fallbackRetryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const addrLine =
    [currentRec.street, currentRec.externalNumber, currentRec.neighborhood, currentRec.city]
      .filter(Boolean)
      .join(", ") || currentRec.mapSearchQuery;

  const stopSummary =
    ordered.length > 1
      ? `Parada ${current.visitOrder} · ${stopIdx + 1}/${ordered.length}`
      : `Parada ${current.visitOrder}`;

  const mapLoading =
    mapMode === "route" ? staticRoute.loading : liveNav.loadingDirections;

  if (isDeliveryFocus) {
    return (
      <SafeAreaView style={styles.deliveryFocusRoot} edges={["top", "left", "right"]}>
        {flow === "delivery_count" ? (
          <HeaderTitle
            title="Conteo de entrega"
            subtitle={stopSummary}
            tone="light"
            onBack={onCancelDeliveryCount}
          />
        ) : null}
        {flow === "signature" ? (
          <HeaderTitle
            title="Firma del cliente"
            subtitle={`${stopSummary} · ${addrLine}`}
            tone="light"
            onBack={closeSignatureModal}
          />
        ) : null}
        {flow === "end_fuel" ? (
          <HeaderTitle
            title="Cierre de ruta"
            subtitle={`${detail.route.folio} · Vehículo`}
            tone="light"
          />
        ) : null}
        {flow === "delivery_count" ? (
          <Animated.View
            style={[
              styles.deliveryFocusShell,
              styles.deliveryFocusBody,
              {
                paddingBottom: Math.max(insets.bottom, 14),
                opacity: flowFade,
                transform: [{ translateY: flowSlide }],
              },
            ]}
          >
            <DriverRouteDeliveryCountPanel
              addressLine={addrLine}
              lines={deliveryLines}
              payment={deliveryPayment}
              deliveredByRecordId={deliveredByRecordId}
              amountReceivedRaw={amountReceivedRaw}
              evidencePhotos={deliveryEvidencePhotos}
              onChangeQty={setDeliveredQty}
              onChangeAmountReceived={setAmountReceivedRaw}
              onChangeEvidencePhotos={setDeliveryEvidencePhotos}
              onContinue={onContinueToSignature}
            />
          </Animated.View>
        ) : (
          <KeyboardAvoidingView
            style={styles.deliveryFocusShell}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 8 : 0}
          >
            <Animated.View
              style={[
                styles.deliveryFocusBody,
                {
                  paddingBottom: Math.max(insets.bottom, 14),
                  opacity: flowFade,
                  transform: [{ translateY: flowSlide }],
                },
              ]}
            >
              {flow === "signature" ? (
              <View style={styles.sigPanel}>
                <View style={styles.sigPanelHead}>
                  <Text style={styles.sigPanelSub}>
                    Confirma que la entrega está correcta.
                  </Text>
                  <TouchableOpacity
                    onPress={() => sigRef.current?.clearSignature()}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Limpiar firma"
                  >
                    <Text style={styles.sigLimpiarText}>Limpiar</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.sigCanvasWrap,
                    {
                      height: Math.min(
                        deliveryFocusScrollMaxH,
                        Math.max(180, Math.round(winH * 0.34)),
                      ),
                    },
                  ]}
                >
                  <SignatureScreen
                    ref={sigRef}
                    webStyle={signatureWebStyle}
                    scrollable={false}
                    nestedScrollEnabled={false}
                    webviewProps={
                      Platform.OS === "ios"
                        ? { contentInsetAdjustmentBehavior: "never" as const }
                        : undefined
                    }
                    onOK={onSignatureOk}
                    onEmpty={onSignatureEmpty}
                    descriptionText="Firma del cliente"
                    clearText="Limpiar"
                    confirmText=""
                    autoClear={false}
                  />
                </View>
                <View style={styles.sigPanelActions}>
                  <TouchableOpacity
                    style={styles.sigGhostBtn}
                    onPress={closeSignatureModal}
                    activeOpacity={0.85}
                    disabled={signatureBusy}
                    accessibilityRole="button"
                    accessibilityLabel="Volver al conteo"
                  >
                    <Text style={styles.sigGhostBtnText}>Volver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sigPrimaryBtn, signatureBusy ? styles.sigPrimaryBtnBusy : null]}
                    onPress={requestReadSignature}
                    activeOpacity={0.85}
                    disabled={signatureBusy}
                    accessibilityRole="button"
                    accessibilityLabel="Confirmar firma y finalizar entrega"
                  >
                    <Text style={styles.sigPrimaryBtnText}>
                      {signatureBusy ? "Finalizando…" : "Confirmar firma"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            {flow === "end_fuel" ? (
              <ScrollView
                style={{ maxHeight: deliveryFocusScrollMaxH }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <DriverRouteVehicleCheckPhotos
                  photos={endVehiclePhotos}
                  onChange={setEndVehiclePhotos}
                  phase="end"
                />
                <DriverRouteCashHandoverPanel
                  amountMxn={cashHandoverAmountMxn}
                  busy={handoverBusy}
                  completed={cashHandoverCompleted}
                  onConfirm={() => void confirmCashHandover()}
                />
                <TouchableOpacity
                  style={[
                    styles.sigPrimaryBtn,
                    styles.endFuelBtn,
                    !canFinalizeRoute || finalizeBusy ? styles.sigPrimaryBtnBusy : null,
                  ]}
                  onPress={() => void finalizeRoute()}
                  activeOpacity={0.85}
                  disabled={!canFinalizeRoute || finalizeBusy}
                  accessibilityRole="button"
                  accessibilityLabel="Finalizar ruta"
                >
                  <Text style={styles.sigPrimaryBtnText}>
                    {finalizeBusy ? "Finalizando…" : "Finalizar ruta"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
            </Animated.View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screenRoot}>
      {mapMode === "route" ? (
        <DriverRouteTripMapWebView
          key={`route-${stopIdx}`}
          model={staticRoute.model}
          fill
          fitPadding={fitPadding}
          mapFitOptions={{ maxZoom: 16, zoomBoost: false, animateDraw: true }}
        />
      ) : (
        <DriverRouteNavLiveMapWebView
          key={`live-${stopIdx}`}
          ref={liveMapRef}
          model={liveMapModel}
          fitPadding={fitPadding}
          onMapLoaded={onLiveMapLoaded}
        />
      )}

      {mapLoading ? (
        <View style={styles.mapLoading} pointerEvents="none">
          <ActivityIndicator size="large" color="#EA7600" />
        </View>
      ) : null}

      <View style={styles.overlayColumn} pointerEvents="box-none">
        <View style={[styles.routeBanner, { marginTop: Math.round(insets.top) + 10 }]}>
          <Text style={styles.routeBannerKicker}>{detail.route.folio}</Text>
          <Text style={styles.routeBannerTitle}>{stopSummary}</Text>
          <Text style={styles.routeBannerAddr} numberOfLines={2}>
            {addrLine}
          </Text>
          <Text style={styles.routeBannerMode}>
            {mapMode === "route" ? "Vista de ruta" : "Navegación en tiempo real"}
          </Text>
        </View>

        {mapMode === "live" && !liveNav.loadingDirections ? (
          <View style={styles.liveNavCard}>
            <View style={styles.liveNavTurn}>
              <NavTurnGlyph kind={liveNav.navTurnKind} />
            </View>
            <View style={styles.liveNavText}>
              <Text style={styles.liveNavPrimary} numberOfLines={2}>
                {liveNav.primaryLine}
              </Text>
              <Text style={styles.liveNavSecondary}>
                {liveNav.secondaryLine} · {liveNav.progressLine}
              </Text>
            </View>
          </View>
        ) : null}

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
            onPress={() => void onOpenGoogleMaps()}
            accessibilityRole="button"
            accessibilityLabel="Abrir ruta en Google Maps"
          >
            <Routing2 size={22} color="#0F172A" variant="Bold" />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.mapFab,
              mapMode === "live" ? styles.mapFabActive : null,
              pressed && styles.mapFabPressed,
            ]}
            onPress={onToggleMapMode}
            accessibilityRole="button"
            accessibilityLabel={
              mapMode === "route"
                ? "Ver navegación en tiempo real"
                : "Recentrar navegación"
            }
          >
            <Gps
              size={22}
              color={mapMode === "live" ? "#FFFFFF" : "#0F172A"}
              variant="Bold"
            />
          </Pressable>
        </View>

        <View pointerEvents="box-none">
          <View
            style={[styles.bottomCard, { paddingBottom: Math.max(insets.bottom, 14) }]}
            pointerEvents="auto"
          >
            <Text style={styles.kicker}>{stopSummary}</Text>
            <Text style={styles.addr} numberOfLines={3}>
              {addrLine}
            </Text>
            <SlideToStartAudit
              key={`d-${stopIdx}-s`}
              inDock
              busy={false}
              onSlideComplete={onSwipeRealizarEntrega}
              hintText="Desliza para realizar entrega"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  fallbackCenter: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackMsg: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  fallbackRetry: {
    marginTop: 16,
    backgroundColor: "#EA7600",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  fallbackRetryTxt: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  deliveryFocusRoot: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  deliveryFocusShell: {
    flex: 1,
  },
  deliveryFocusBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  screenRoot: {
    flex: 1,
    position: "relative",
    backgroundColor: "#0f172a",
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,245,249,0.55)",
  },
  overlayColumn: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    pointerEvents: "box-none",
  },
  routeBanner: {
    marginHorizontal: 14,
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 11,
    borderWidth: 1,
    borderColor: "#1E293B",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  routeBannerKicker: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FB923C",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  routeBannerTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  routeBannerAddr: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#CBD5E1",
    lineHeight: 19,
  },
  routeBannerMode: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "800",
    color: "#93C5FD",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  liveNavCard: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  liveNavTurn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  liveNavText: {
    flex: 1,
  },
  liveNavPrimary: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 20,
  },
  liveNavSecondary: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
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
  mapFabActive: {
    backgroundColor: "#EA7600",
  },
  mapFabPressed: {
    opacity: 0.88,
  },
  bottomCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
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
  sigPanel: {
    marginTop: 2,
  },
  sigPanelHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  sigPanelSub: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    lineHeight: 18,
  },
  sigPanelActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  sigLimpiarText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#EA580C",
  },
  sigCanvasWrap: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  sigGhostBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
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
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
  },
  sigPrimaryBtnBusy: {
    opacity: 0.7,
  },
  sigPrimaryBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  endFuelBtn: {
    marginTop: 16,
    flex: undefined,
    width: "100%",
  },
});
