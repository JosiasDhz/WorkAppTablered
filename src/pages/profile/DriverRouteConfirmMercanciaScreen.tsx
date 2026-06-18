import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowRight2 } from "iconsax-react-native";
import Toast from "react-native-toast-message";
import { HeaderTitle } from "../../components/HeaderTitle";
import type { RootStackParamList } from "../../routes/RootStackParamList";
import {
  buildDriverRouteConfirmPayload,
  driverRouteConfirmProgress,
  flattenDriverRouteConfirmLines,
  isDriverRouteLineConfirmable,
  isDriverRouteLineConfirmed,
} from "../../domain/driverRouteConfirmLines";
import { confirmDriverRouteDeliveries } from "../../services/deliveryRoutesService";
import { useDriverRouteAssignmentDetail } from "./hooks/useDriverRouteAssignmentDetail";
import { DriverRouteWorkerCodeModal } from "./driverRoute/DriverRouteWorkerCodeModal";
import { DRIVER_ROUTES_FLOW_USE_DEMO } from "./driverDemo/driverRoutesListDemoFlag";
import { useSessionWorkerCode } from "../../hooks/useSessionWorkerCode";

function extractApiErrorMessage(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const resp = (e as { response?: { data?: { message?: unknown } } }).response;
    const msg = resp?.data?.message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg.map(String).join(", ");
  }
  return "No se pudo confirmar la mercancía";
}

function formatAddress(line: {
  street?: string;
  externalNumber?: string;
  neighborhood?: string;
  city?: string;
}): string {
  return [line.street, line.externalNumber, line.neighborhood, line.city]
    .filter(Boolean)
    .join(", ");
}

function parseQty(raw: string): number {
  const n = Number.parseInt(raw.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function emptyQtyMap(lineIds: string[]): Record<string, string> {
  const o: Record<string, string> = {};
  for (const id of lineIds) {
    o[id] = "";
  }
  return o;
}

export default function DriverRouteConfirmMercanciaScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } =
    useRoute<RouteProp<RootStackParamList, "DriverRouteConfirmMercancia">>();
  const routeId = params?.routeId ?? "";
  const sessionWorkerCode = useSessionWorkerCode();
  const { detail, loading, error, refresh } = useDriverRouteAssignmentDetail(routeId);

  const lines = useMemo(
    () => (detail ? flattenDriverRouteConfirmLines(detail.destinations) : []),
    [detail],
  );
  const progress = useMemo(() => driverRouteConfirmProgress(lines), [lines]);

  const [qtyByLineId, setQtyByLineId] = useState<Record<string, string>>({});
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [workerCodeModalOpen, setWorkerCodeModalOpen] = useState(false);

  const confirmableLines = useMemo(
    () => lines.filter(isDriverRouteLineConfirmable),
    [lines],
  );

  useEffect(() => {
    setQtyByLineId(emptyQtyMap(confirmableLines.map((l) => l.id)));
  }, [confirmableLines]);

  const allConfirmQtyMatched = useMemo(() => {
    if (confirmableLines.length === 0) return false;
    return confirmableLines.every((line) => {
      const raw = (qtyByLineId[line.id] ?? "").trim();
      if (!/\d/.test(raw)) return false;
      return parseQty(raw) === line.quantity;
    });
  }, [confirmableLines, qtyByLineId]);

  const setQty = useCallback((lineId: string, text: string) => {
    setQtyByLineId((prev) => ({ ...prev, [lineId]: text }));
  }, []);

  const handleConfirm = useCallback(
    async (workerCode: string) => {
      if (!allConfirmQtyMatched || confirmBusy) return;
      if (DRIVER_ROUTES_FLOW_USE_DEMO) {
        Toast.show({ type: "success", text1: "Mercancía confirmada (demo)" });
        finishConfirmAndContinue();
        return;
      }
      const payload = buildDriverRouteConfirmPayload(confirmableLines);
      if (
        payload.cartItemDeliveryIds.length === 0 &&
        payload.transferIds.length === 0
      ) {
        setConfirmError("No hay partidas válidas para confirmar");
        setWorkerCodeModalOpen(true);
        return;
      }
      setConfirmBusy(true);
      setConfirmError(null);
      try {
        const res = await confirmDriverRouteDeliveries(routeId, {
          workerCode,
          ...payload,
        });
        setQtyByLineId(emptyQtyMap(confirmableLines.map((l) => l.id)));
        Toast.show({
          type: "success",
          text1: "Mercancía confirmada",
          text2: `${res.confirmedCount} partida${res.confirmedCount === 1 ? "" : "s"} registrada${res.confirmedCount === 1 ? "" : "s"}.`,
        });
        await refresh();
        finishConfirmAndContinue();
      } catch (e: unknown) {
        setConfirmError(extractApiErrorMessage(e));
        setWorkerCodeModalOpen(true);
      } finally {
        setConfirmBusy(false);
      }
    },
    [
      allConfirmQtyMatched,
      confirmBusy,
      confirmableLines,
      finishConfirmAndContinue,
      refresh,
      routeId,
    ],
  );

  const openConfirmModal = useCallback(() => {
    if (!allConfirmQtyMatched) {
      Toast.show({
        type: "info",
        text1: "Cantidades pendientes",
        text2: "Registra la misma cantidad asignada en cada producto.",
      });
      return;
    }
    setConfirmError(null);
    if (sessionWorkerCode) {
      void handleConfirm(sessionWorkerCode);
      return;
    }
    setWorkerCodeModalOpen(true);
  }, [allConfirmQtyMatched, handleConfirm, sessionWorkerCode]);

  const goVehicleCheck = useCallback(() => {
    navigation.navigate("DriverRouteProductPickup", { routeId });
  }, [navigation, routeId]);

  const finishConfirmAndContinue = useCallback(() => {
    setWorkerCodeModalOpen(false);
    goVehicleCheck();
  }, [goVehicleCheck]);

  const dockBottomPad = Math.max(insets.bottom, 12);

  if (loading && !detail) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <HeaderTitle title="Confirmar mercancía" subtitle="Cargando ruta…" tone="light" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EA7600" />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <HeaderTitle title="Confirmar mercancía" subtitle="Sin datos" tone="light" />
        <View style={styles.center}>
          <Text style={styles.muted}>{error ?? "No se pudo cargar la ruta."}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void refresh()}>
            <Text style={styles.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { route } = detail;
  const showVehicleDock = progress.allConfirmed;
  const showConfirmDock = !progress.allConfirmed && confirmableLines.length > 0;
  const scrollBottomPad =
    (showVehicleDock ? 72 : showConfirmDock ? 72 : 24) + dockBottomPad;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.shell}>
        <HeaderTitle
          title="Confirmar mercancía"
          subtitle={`${route.folio} · ${progress.confirmedCount}/${progress.totalCount || lines.length} confirmadas`}
          tone="light"
        />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
        <ScrollView
          contentContainerStyle={[styles.scrollPad, { paddingBottom: scrollBottomPad }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Recepción de mercancía</Text>
            <Text style={styles.progressSub}>
              Escribe la misma cantidad asignada en cada producto para confirmar.
            </Text>
          </View>

          {lines.map((line) => {
            const confirmable = isDriverRouteLineConfirmable(line);
            const confirmed = isDriverRouteLineConfirmed(line);
            const addr = formatAddress(line);
            const raw = qtyByLineId[line.id] ?? "";
            const parsed = parseQty(raw);
            const hasQty = /\d/.test(raw.trim());
            const over = hasQty && parsed > line.quantity;
            const under = hasQty && parsed < line.quantity;
            return (
              <View
                key={line.id}
                style={styles.lineCard}
              >
                <View style={styles.lineTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prodName} numberOfLines={3}>
                      {line.productName}
                    </Text>
                    <Text style={styles.folio}>{line.saleFolio}</Text>
                    {addr ? (
                      <Text style={styles.addr} numberOfLines={2}>
                        {addr}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {confirmable ? (
                  <View style={styles.qtyRow}>
                    <View style={styles.qtyCol}>
                      <Text style={styles.qtyLbl}>En ruta</Text>
                      <Text style={styles.qtyExpected}>{line.quantity}</Text>
                    </View>
                    <View style={[styles.qtyCol, styles.qtyColInput]}>
                      <Text style={styles.qtyLbl}>Confirmado</Text>
                      <TextInput
                        value={raw}
                        onChangeText={(t) => setQty(line.id, t)}
                        placeholder="-"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        inputMode="numeric"
                        maxLength={6}
                        style={[styles.input, over || under ? styles.inputWarn : null]}
                        accessibilityLabel={`Cantidad a confirmar para ${line.productName}`}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.qtyRow}>
                    <View style={styles.qtyCol}>
                      <Text style={styles.qtyLbl}>Cantidad</Text>
                      <Text style={styles.qtyExpected}>{line.quantity}</Text>
                    </View>
                  </View>
                )}
                {over ? (
                  <Text style={styles.warn}>
                    No puede superar lo asignado ({line.quantity}).
                  </Text>
                ) : null}
                {under ? (
                  <Text style={styles.warn}>
                    Debe coincidir con lo asignado ({line.quantity}).
                  </Text>
                ) : null}
                {confirmed ? (
                  <View style={styles.badgeRow}>
                    <Text style={styles.badgeConfirmed}>Confirmado por chofer</Text>
                  </View>
                ) : !confirmable ? (
                  <View style={styles.badgeRow}>
                    <Text style={styles.badgeWarehouse}>Esperando almacén</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
          {!allConfirmQtyMatched && confirmableLines.length > 0 ? (
            <View style={styles.pendingWrap}>
              <Text style={styles.pendingTitle}>Antes de confirmar</Text>
              <Text style={styles.pendingItem}>
                Registra las cantidades recibidas en cada producto pendiente.
              </Text>
            </View>
          ) : null}
        </ScrollView>
        </KeyboardAvoidingView>

        {showConfirmDock ? (
          <View style={[styles.dock, { paddingBottom: dockBottomPad }]}>
            <Pressable
              style={[styles.dockBtn, !allConfirmQtyMatched ? styles.dockBtnDisabled : null]}
              onPress={openConfirmModal}
              disabled={!allConfirmQtyMatched}
            >
              <Text style={styles.dockBtnTxt}>Confirmar mercancía</Text>
            </Pressable>
          </View>
        ) : null}

        {showVehicleDock ? (
          <View style={[styles.dock, { paddingBottom: dockBottomPad }]}>
            <Pressable style={styles.dockBtn} onPress={goVehicleCheck}>
              <Text style={styles.dockBtnTxt}>Verificación del vehículo</Text>
              <ArrowRight2 size={20} color="#FFFFFF" variant="Bold" />
            </Pressable>
          </View>
        ) : null}

        <DriverRouteWorkerCodeModal
          visible={workerCodeModalOpen}
          busy={confirmBusy}
          error={confirmError}
          defaultWorkerCode={sessionWorkerCode}
          title="Confirmar mercancía"
          subtitle="Ingresa tu código de trabajador para registrar la recepción."
          confirmLabel="Confirmar"
          onClose={() => {
            if (!confirmBusy) {
              setWorkerCodeModalOpen(false);
              setConfirmError(null);
            }
          }}
          onConfirm={handleConfirm}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1F5F9" },
  shell: { flex: 1, position: "relative" },
  flex: { flex: 1 },
  center: { padding: 24, alignItems: "flex-start" },
  muted: { fontSize: 15, color: "#64748B" },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#EA7600",
  },
  retryTxt: { color: "#FFFFFF", fontWeight: "800" },
  scrollPad: { paddingHorizontal: 16, paddingTop: 8 },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  progressTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  progressSub: { marginTop: 6, fontSize: 13, fontWeight: "600", color: "#64748B", lineHeight: 18 },
  lineCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  lineTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  prodName: { fontSize: 14, fontWeight: "700", color: "#0F172A", lineHeight: 19 },
  folio: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#64748B" },
  addr: { marginTop: 4, fontSize: 12, fontWeight: "600", color: "#94A3B8" },
  qtyRow: { marginTop: 12, flexDirection: "row", gap: 12 },
  qtyCol: { flex: 1 },
  qtyColInput: { maxWidth: 120 },
  qtyLbl: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  qtyExpected: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  inputWarn: {
    borderColor: "#F97316",
    backgroundColor: "#FFF7ED",
  },
  warn: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#C2410C",
  },
  badgeRow: { marginTop: 10 },
  badgeConfirmed: { fontSize: 12, fontWeight: "800", color: "#047857" },
  badgeWarehouse: { fontSize: 12, fontWeight: "800", color: "#64748B" },
  pendingWrap: {
    marginTop: 4,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  pendingTitle: { fontSize: 13, fontWeight: "800", color: "#9A3412", marginBottom: 6 },
  pendingItem: { fontSize: 13, fontWeight: "600", color: "#C2410C", lineHeight: 18 },
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  dockBtn: {
    height: 56,
    borderRadius: 999,
    backgroundColor: "#EA7600",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dockBtnDisabled: { opacity: 0.55 },
  dockBtnTxt: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
