import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SlideToStartAudit } from "../../components/SlideToStartAudit";
import type { RootStackParamList } from "../../routes/RootStackParamList";
import {
  beginDeliveryRoutePickup,
  startDeliveryRoute,
  uploadDeliveryRouteVehicleEvidence,
} from "../../services/deliveryRoutesService";
import {
  driverRouteConfirmProgress,
  flattenDriverRouteConfirmLines,
} from "../../domain/driverRouteConfirmLines";
import { useDriverRouteAssignmentDetail } from "./hooks/useDriverRouteAssignmentDetail";
import { getDriverRouteAssignmentDetail } from "./driverDemo/resolveDriverRouteAssignmentDetail";
import { DRIVER_ROUTES_FLOW_USE_DEMO } from "./driverDemo/driverRoutesListDemoFlag";
import {
  DriverRouteVehicleCheckPhotos,
  isDriverRouteStartVehicleCheckComplete,
  parseOdometerReading,
  type DriverRouteVehicleCheckPhotosState,
} from "./driverRoute/DriverRouteVehicleCheckPhotos";
import { DriverRouteWorkerCodeModal } from "./driverRoute/DriverRouteWorkerCodeModal";
import { useSessionWorkerCode } from "../../hooks/useSessionWorkerCode";

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
  return "No se pudo iniciar la ruta";
}

export default function DriverRouteProductPickupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } =
    useRoute<RouteProp<RootStackParamList, "DriverRouteProductPickup">>();
  const routeId = params?.routeId ?? "";
  const sessionWorkerCode = useSessionWorkerCode();
  const {
    detail: apiDetail,
    loading,
    error,
    refresh,
  } = useDriverRouteAssignmentDetail(routeId);
  const demoDetail = useMemo(
    () => (DRIVER_ROUTES_FLOW_USE_DEMO ? getDriverRouteAssignmentDetail(routeId) : null),
    [routeId],
  );
  const detail = demoDetail ?? apiDetail;

  const confirmProgress = useMemo(() => {
    if (!detail) return null;
    return driverRouteConfirmProgress(flattenDriverRouteConfirmLines(detail.destinations));
  }, [detail]);

  const [vehiclePhotos, setVehiclePhotos] = useState<DriverRouteVehicleCheckPhotosState>({
    odometer: null,
    odometerReading: "",
    fuel: null,
  });
  const [pickupBusy, setPickupBusy] = useState(false);
  const [startBusy, setStartBusy] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [workerCodeModalOpen, setWorkerCodeModalOpen] = useState(false);

  useEffect(() => {
    if (!detail) return;
    const status = detail.route.status;
    if (status === "COMPLETA") {
      navigation.replace("DriverRouteDetail", { routeId });
      return;
    }
    if (status === "EN_PROCESO") {
      navigation.replace("DriverRouteNavFirstStop", { routeId });
      return;
    }
    if (DRIVER_ROUTES_FLOW_USE_DEMO) return;
    if (status !== "CONFIRMADA" && status !== "LEVANTAMIENTO") return;
    if (status === "LEVANTAMIENTO") return;
    if (!confirmProgress?.allConfirmed) return;
    setPickupBusy(true);
    void beginDeliveryRoutePickup(routeId)
      .then(() => refresh())
      .catch(() => {})
      .finally(() => setPickupBusy(false));
  }, [confirmProgress?.allConfirmed, detail, navigation, refresh, routeId]);

  const vehicleCheckComplete = isDriverRouteStartVehicleCheckComplete(vehiclePhotos);
  const canStartRoute = vehicleCheckComplete && (confirmProgress?.allConfirmed ?? DRIVER_ROUTES_FLOW_USE_DEMO);

  const dockBottomPad = Math.max(insets.bottom, 12);
  const routeSwipeDockH = 88 + dockBottomPad;

  const handleStartRouteConfirm = useCallback(
    async (workerCode: string) => {
      if (!canStartRoute || startBusy) return;
      const odometerPhoto = vehiclePhotos.odometer;
      const odometerReading = parseOdometerReading(vehiclePhotos.odometerReading);
      if (!odometerPhoto || odometerReading == null) {
        setStartError("Completa la foto y el kilometraje del tacómetro");
        setWorkerCodeModalOpen(true);
        return;
      }

      if (DRIVER_ROUTES_FLOW_USE_DEMO) {
        setWorkerCodeModalOpen(false);
        navigation.navigate("DriverRouteNavFirstStop", { routeId });
        return;
      }

      setStartBusy(true);
      setStartError(null);
      try {
        const uploaded = await uploadDeliveryRouteVehicleEvidence(odometerPhoto);
        await startDeliveryRoute(routeId, {
          workerCode,
          odometerReading,
          odometerEvidenceFileId: uploaded.id,
        });
        setWorkerCodeModalOpen(false);
        Toast.show({
          type: "success",
          text1: "Ruta iniciada",
          text2: "Ya puedes seguir el recorrido.",
        });
        navigation.navigate("DriverRouteNavFirstStop", { routeId });
      } catch (e: unknown) {
        setStartError(extractApiErrorMessage(e));
        setWorkerCodeModalOpen(true);
      } finally {
        setStartBusy(false);
      }
    },
    [canStartRoute, navigation, routeId, startBusy, vehiclePhotos],
  );

  const onStartRoute = useCallback(async () => {
    if (!canStartRoute || startBusy) return;
    setStartError(null);
    if (sessionWorkerCode) {
      await handleStartRouteConfirm(sessionWorkerCode);
      return;
    }
    setWorkerCodeModalOpen(true);
  }, [canStartRoute, handleStartRouteConfirm, sessionWorkerCode, startBusy]);

  const goConfirm = useCallback(() => {
    navigation.navigate("DriverRouteConfirmMercancia", { routeId });
  }, [navigation, routeId]);

  if (loading && !detail) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <HeaderTitle title="Verificación del vehículo" subtitle="Cargando ruta…" tone="light" />
        <View style={styles.missing}>
          <ActivityIndicator size="large" color="#EA7600" />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <HeaderTitle title="Verificación del vehículo" subtitle="Sin datos de ruta" tone="light" />
        <View style={styles.missing}>
          <Text style={styles.missingTxt}>
            {error ?? "No hay ruta para verificar el vehículo."}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void refresh()}>
            <Text style={styles.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { route } = detail;
  const needsConfirm = confirmProgress != null && !confirmProgress.allConfirmed;
  const showStartDock = !needsConfirm && canStartRoute;
  const scrollBottomPad = showStartDock ? routeSwipeDockH + 20 : 40;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.shell}>
        <HeaderTitle
          title="Verificación del vehículo"
          subtitle={`${route.folio} · antes de salir`}
          tone="light"
        />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollPad, { paddingBottom: scrollBottomPad }]}
            keyboardShouldPersistTaps="handled"
          >
            {needsConfirm ? (
              <View style={styles.pendingWrap}>
                <Text style={styles.pendingTitle}>Confirma la mercancía primero</Text>
                <Text style={styles.pendingItem}>
                  Debes confirmar la recepción antes de registrar el tacómetro.
                </Text>
                <Pressable style={styles.linkBtn} onPress={goConfirm}>
                  <Text style={styles.linkBtnTxt}>Ir a confirmar mercancía</Text>
                </Pressable>
              </View>
            ) : null}
            {pickupBusy ? (
              <View style={styles.busyRow}>
                <ActivityIndicator color="#EA7600" />
                <Text style={styles.busyTxt}>Preparando salida…</Text>
              </View>
            ) : null}
            <DriverRouteVehicleCheckPhotos
              photos={vehiclePhotos}
              onChange={setVehiclePhotos}
              phase="start"
            />
            {!vehicleCheckComplete ? (
              <View style={styles.pendingWrap}>
                <Text style={styles.pendingTitle}>Antes de iniciar la ruta</Text>
                <Text style={styles.pendingItem}>
                  Toma la foto del tacómetro y registra el kilometraje.
                </Text>
              </View>
            ) : (
              <View style={styles.reviewWrap}>
                <Text style={styles.reviewTitle}>Revisión lista</Text>
                <Text style={styles.reviewItem}>
                  Tacómetro: {parseOdometerReading(vehiclePhotos.odometerReading)} km
                </Text>
                <Text style={styles.reviewItem}>
                  Toca la foto arriba para ampliarla antes de iniciar.
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
        {showStartDock ? (
          <View style={[styles.routeDock, { paddingBottom: dockBottomPad }]}>
            <SlideToStartAudit
              inDock
              hintText="Iniciar ruta"
              onSlideComplete={onStartRoute}
              busy={startBusy}
              errorToken={startError}
            />
          </View>
        ) : null}
        <DriverRouteWorkerCodeModal
          visible={workerCodeModalOpen}
          busy={startBusy}
          error={startError}
          defaultWorkerCode={sessionWorkerCode}
          subtitle="Revisa el tacómetro y confirma con tu código para iniciar la ruta."
          onClose={() => {
            if (!startBusy) {
              setWorkerCodeModalOpen(false);
              setStartError(null);
            }
          }}
          onConfirm={handleStartRouteConfirm}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1F5F9" },
  shell: { flex: 1, position: "relative" },
  flex: { flex: 1 },
  routeDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "transparent",
    ...Platform.select({ android: { elevation: 24 } }),
  },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 40 },
  missing: { padding: 24 },
  missingTxt: { fontSize: 15, color: "#64748B" },
  retryBtn: {
    marginTop: 16,
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#EA7600",
  },
  retryTxt: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  busyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  busyTxt: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  pendingWrap: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  pendingTitle: { fontSize: 13, fontWeight: "800", color: "#9A3412", marginBottom: 6 },
  pendingItem: { fontSize: 13, fontWeight: "600", color: "#C2410C", lineHeight: 18 },
  linkBtn: { marginTop: 10, alignSelf: "flex-start" },
  linkBtnTxt: { fontSize: 13, fontWeight: "800", color: "#EA7600" },
  reviewWrap: {
    marginTop: 4,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  reviewTitle: { fontSize: 13, fontWeight: "800", color: "#065F46", marginBottom: 6 },
  reviewItem: { fontSize: 13, fontWeight: "600", color: "#047857", lineHeight: 18 },
});
