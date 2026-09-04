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
import { ArrowRight2, Warning2 } from "iconsax-react-native";
import Toast from "react-native-toast-message";
import { HeaderTitle } from "../../components/HeaderTitle";
import { headerSafeEdges } from "../../routes/headerSafeEdges";
import type { RootStackParamList } from "../../routes/RootStackParamList";
import type { DriverIncidentReason } from "../../types/driverIncidents";
import {
  buildDriverRouteReceiptPayload,
  driverRouteConfirmProgress,
  flattenDriverRouteConfirmLines,
  allDriverRouteReceiptQtyCaptured,
  driverRouteReceiptHasDiscrepancy,
  isDriverRouteLineConfirmable,
  isDriverRouteLineConfirmed,
} from "../../domain/driverRouteConfirmLines";
import { confirmDriverRouteReceipt } from "../../services/driverIncidentsService";
import { useDriverRouteAssignmentDetail } from "./hooks/useDriverRouteAssignmentDetail";
import { DriverRouteWorkerCodeModal } from "./driverRoute/DriverRouteWorkerCodeModal";
import {
  DriverRouteLineIncidentModal,
  type LineIncidentDraft,
} from "./driverRoute/DriverRouteLineIncidentModal";
import { DRIVER_ROUTES_FLOW_USE_DEMO } from "./driverDemo/driverRoutesListDemoFlag";
import { useSessionWorkerCode } from "../../hooks/useSessionWorkerCode";
import { useDriverUi, type DriverUi } from "./driverRoute/driverUi";

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

function reasonLabel(reason: DriverIncidentReason | undefined): string {
  if (reason === "faltante_recepcion") return "Faltante";
  if (reason === "danado_recepcion") return "Dañado";
  if (reason === "danado_transito") return "Dañado en ruta";
  return "Incidencia";
}

export default function DriverRouteConfirmMercanciaScreen() {
  const ui = useDriverUi();
  const styles = useMemo(() => createStyles(ui), [ui]);
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
  const [damagedByLineId, setDamagedByLineId] = useState<Record<string, string>>({});
  const [commentByLineId, setCommentByLineId] = useState<Record<string, string>>({});
  const [reasonByLineId, setReasonByLineId] = useState<
    Record<string, DriverIncidentReason | undefined>
  >({});
  const [incidentLineId, setIncidentLineId] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [workerCodeModalOpen, setWorkerCodeModalOpen] = useState(false);

  const confirmableLines = useMemo(
    () => lines.filter(isDriverRouteLineConfirmable),
    [lines],
  );

  useEffect(() => {
    const ids = confirmableLines.map((l) => l.id);
    setQtyByLineId(emptyQtyMap(ids));
    setDamagedByLineId(emptyQtyMap(ids));
    setCommentByLineId(emptyQtyMap(ids));
    setReasonByLineId({});
  }, [confirmableLines]);

  const allQtyCaptured = useMemo(
    () => allDriverRouteReceiptQtyCaptured(confirmableLines, qtyByLineId),
    [confirmableLines, qtyByLineId],
  );

  const hasDiscrepancy = useMemo(
    () =>
      driverRouteReceiptHasDiscrepancy(
        confirmableLines,
        qtyByLineId,
        damagedByLineId,
      ),
    [confirmableLines, qtyByLineId, damagedByLineId],
  );

  const setQty = useCallback((lineId: string, text: string) => {
    setQtyByLineId((prev) => ({ ...prev, [lineId]: text }));
    setReasonByLineId((prev) => {
      if (!prev[lineId]) return prev;
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
    setDamagedByLineId((prev) => ({ ...prev, [lineId]: "" }));
  }, []);

  const incidentLine = useMemo(
    () => lines.find((line) => line.id === incidentLineId) ?? null,
    [incidentLineId, lines],
  );

  const incidentInitial = useMemo((): LineIncidentDraft | null => {
    if (!incidentLineId) return null;
    const reason = reasonByLineId[incidentLineId];
    if (!reason) return null;
    return {
      reason,
      receivedQuantity: parseQty(qtyByLineId[incidentLineId] ?? "0"),
      damagedQuantity: parseQty(damagedByLineId[incidentLineId] ?? "0"),
      comment: commentByLineId[incidentLineId] ?? "",
    };
  }, [
    commentByLineId,
    damagedByLineId,
    incidentLineId,
    qtyByLineId,
    reasonByLineId,
  ]);

  const applyIncident = useCallback((lineId: string, draft: LineIncidentDraft) => {
    setQtyByLineId((prev) => ({ ...prev, [lineId]: String(draft.receivedQuantity) }));
    setDamagedByLineId((prev) => ({
      ...prev,
      [lineId]: draft.damagedQuantity > 0 ? String(draft.damagedQuantity) : "",
    }));
    setCommentByLineId((prev) => ({ ...prev, [lineId]: draft.comment }));
    setReasonByLineId((prev) => ({ ...prev, [lineId]: draft.reason }));
    setIncidentLineId(null);
  }, []);

  const clearIncident = useCallback((lineId: string) => {
    setReasonByLineId((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
    setDamagedByLineId((prev) => ({ ...prev, [lineId]: "" }));
    setCommentByLineId((prev) => ({ ...prev, [lineId]: "" }));
    setQtyByLineId((prev) => ({ ...prev, [lineId]: "" }));
    setIncidentLineId(null);
  }, []);

  const goVehicleCheck = useCallback(() => {
    navigation.navigate("DriverRouteProductPickup", { routeId });
  }, [navigation, routeId]);

  const finishConfirmAndContinue = useCallback(() => {
    setWorkerCodeModalOpen(false);
    goVehicleCheck();
  }, [goVehicleCheck]);

  const handleConfirm = useCallback(
    async (workerCode: string) => {
      if (!allQtyCaptured || confirmBusy) return;
      if (DRIVER_ROUTES_FLOW_USE_DEMO) {
        Toast.show({ type: "success", text1: "Mercancía confirmada (demo)" });
        finishConfirmAndContinue();
        return;
      }
      const payloadLines = buildDriverRouteReceiptPayload(
        confirmableLines,
        qtyByLineId,
        damagedByLineId,
        commentByLineId,
        reasonByLineId,
      );
      setConfirmBusy(true);
      setConfirmError(null);
      try {
        const res = await confirmDriverRouteReceipt(routeId, {
          workerCode,
          lines: payloadLines,
        });
        const ids = confirmableLines.map((l) => l.id);
        setQtyByLineId(emptyQtyMap(ids));
        setDamagedByLineId(emptyQtyMap(ids));
        setCommentByLineId(emptyQtyMap(ids));
        setReasonByLineId({});
        Toast.show({
          type: "success",
          text1: "Mercancía confirmada",
          text2:
            res.incidentCount > 0
              ? `${res.confirmedCount} partida(s) · ${res.incidentCount} incidencia(s) registrada(s).`
              : `${res.confirmedCount} partida${res.confirmedCount === 1 ? "" : "s"} registrada${res.confirmedCount === 1 ? "" : "s"}.`,
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
      allQtyCaptured,
      commentByLineId,
      confirmBusy,
      confirmableLines,
      damagedByLineId,
      finishConfirmAndContinue,
      qtyByLineId,
      reasonByLineId,
      refresh,
      routeId,
    ],
  );

  const openConfirmModal = useCallback(() => {
    if (!allQtyCaptured) {
      Toast.show({
        type: "info",
        text1: "Cantidades pendientes",
        text2: "Confirma cada producto o reporta una incidencia.",
      });
      return;
    }
    const missingIncident = confirmableLines.find((line) => {
      const received = parseQty(qtyByLineId[line.id] ?? "");
      return received < line.quantity && !reasonByLineId[line.id];
    });
    if (missingIncident) {
      Toast.show({
        type: "info",
        text1: "Falta reportar incidencia",
        text2: "Toca el botón de advertencia e indica cantidad y motivo.",
      });
      setIncidentLineId(missingIncident.id);
      return;
    }
    setConfirmError(null);
    if (sessionWorkerCode) {
      void handleConfirm(sessionWorkerCode);
      return;
    }
    setWorkerCodeModalOpen(true);
  }, [
    allQtyCaptured,
    confirmableLines,
    handleConfirm,
    qtyByLineId,
    reasonByLineId,
    sessionWorkerCode,
  ]);

  const dockBottomPad = Math.max(insets.bottom, 12);

  if (loading && !detail) {
    return (
      <SafeAreaView style={styles.safe} edges={headerSafeEdges("top", "left", "right")}>
        <HeaderTitle title="Confirmar mercancía" subtitle="Cargando ruta…" tone="light" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ui.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.safe} edges={headerSafeEdges("top", "left", "right")}>
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
  const showVehicleDock =
    progress.allConfirmed && progress.confirmedCount > 0 && confirmableLines.length === 0;
  const showConfirmDock = !progress.allConfirmed && confirmableLines.length > 0;
  const scrollBottomPad =
    (showVehicleDock ? 72 : showConfirmDock ? 72 : 24) + dockBottomPad;

  return (
    <SafeAreaView style={styles.safe} edges={headerSafeEdges("top", "left", "right")}>
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
                Si todo está bien, captura la cantidad completa. Si hay faltante o daño,
                toca el botón de advertencia para reportar la incidencia.
              </Text>
              {hasDiscrepancy ? (
                <Text style={[styles.progressSub, { color: ui.amber, marginTop: 8 }]}>
                  Hay incidencias: se avisará al almacenista al confirmar.
                </Text>
              ) : null}
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
              const hasIncident = Boolean(reasonByLineId[line.id]);
              return (
                <View
                  key={line.id}
                  style={[
                    styles.lineCard,
                    hasIncident ? styles.lineCardIncident : null,
                  ]}
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
                    {confirmable ? (
                      <Pressable
                        style={[
                          styles.warnBtn,
                          hasIncident ? styles.warnBtnOn : null,
                        ]}
                        onPress={() => setIncidentLineId(line.id)}
                        accessibilityLabel="Reportar incidencia del producto"
                      >
                        <Warning2
                          size={18}
                          color={hasIncident ? "#FFFFFF" : ui.accentInk}
                          variant="Bold"
                        />
                      </Pressable>
                    ) : null}
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
                          placeholderTextColor={ui.faint}
                          keyboardType="number-pad"
                          inputMode="numeric"
                          maxLength={6}
                          editable={!hasIncident}
                          style={[
                            styles.input,
                            over || under || hasIncident ? styles.inputWarn : null,
                            hasIncident ? styles.inputLocked : null,
                          ]}
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

                  {confirmable ? (
                    <Pressable
                      style={styles.incidentLink}
                      onPress={() => setIncidentLineId(line.id)}
                    >
                      <Warning2 size={16} color={ui.accentInk} variant="Bold" />
                      <Text style={styles.incidentLinkTxt}>
                        {hasIncident
                          ? `Incidencia: ${reasonLabel(reasonByLineId[line.id])}`
                          : "Reportar incidencia (faltante / daño)"}
                      </Text>
                    </Pressable>
                  ) : null}

                  {hasIncident ? (
                    <View style={styles.incidentSummary}>
                      <Text style={styles.incidentSummaryTxt}>
                        {(() => {
                          const damaged = parseQty(damagedByLineId[line.id] ?? "0");
                          const received = parseQty(raw || "0");
                          if (reasonByLineId[line.id] === "danado_recepcion") {
                            return `${damaged} de ${line.quantity} dañadas`;
                          }
                          const missing = Math.max(0, line.quantity - received);
                          return `${missing} de ${line.quantity} faltantes`;
                        })()}
                      </Text>
                      {(commentByLineId[line.id] ?? "").trim() ? (
                        <Text style={styles.incidentComment} numberOfLines={2}>
                          {commentByLineId[line.id]}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {over ? (
                    <Text style={styles.warn}>
                      No puede superar lo asignado ({line.quantity}).
                    </Text>
                  ) : null}
                  {under && !hasIncident ? (
                    <Text style={styles.warn}>
                      Cantidad menor: usa “Reportar incidencia” para indicar el motivo.
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

            {!allQtyCaptured && confirmableLines.length > 0 ? (
              <View style={styles.pendingWrap}>
                <Text style={styles.pendingTitle}>Antes de confirmar</Text>
                <Text style={styles.pendingItem}>
                  Confirma cada producto o reporta incidencia con el botón de advertencia.
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>

        {showConfirmDock ? (
          <View style={[styles.dock, { paddingBottom: dockBottomPad }]}>
            <Pressable
              style={[styles.dockBtn, !allQtyCaptured ? styles.dockBtnDisabled : null]}
              onPress={openConfirmModal}
              disabled={!allQtyCaptured}
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

        {incidentLine ? (
          <DriverRouteLineIncidentModal
            visible
            productName={incidentLine.productName}
            expectedQuantity={incidentLine.quantity}
            initial={incidentInitial}
            onClose={() => setIncidentLineId(null)}
            onSave={(draft) => applyIncident(incidentLine.id, draft)}
            onClear={
              incidentInitial
                ? () => clearIncident(incidentLine.id)
                : undefined
            }
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function createStyles(ui: DriverUi) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: ui.layout },
    shell: { flex: 1, position: "relative" },
    flex: { flex: 1 },
    center: { padding: 24, alignItems: "flex-start" },
    muted: { fontSize: 15, color: ui.muted },
    retryBtn: {
      marginTop: 16,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: ui.accent,
    },
    retryTxt: { color: "#FFFFFF", fontWeight: "800" },
    scrollPad: { paddingHorizontal: 16, paddingTop: 8 },
    progressCard: {
      backgroundColor: ui.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: ui.border,
    },
    progressTitle: { fontSize: 16, fontWeight: "800", color: ui.ink },
    progressSub: {
      marginTop: 6,
      fontSize: 13,
      fontWeight: "600",
      color: ui.muted,
      lineHeight: 18,
    },
    lineCard: {
      backgroundColor: ui.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: ui.border,
    },
    lineCardIncident: {
      borderColor: ui.accentBorder,
      backgroundColor: ui.amberSoft,
    },
    lineTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    prodName: { fontSize: 14, fontWeight: "700", color: ui.ink, lineHeight: 19 },
    folio: { marginTop: 4, fontSize: 12, fontWeight: "700", color: ui.muted },
    addr: { marginTop: 4, fontSize: 12, fontWeight: "600", color: ui.faint },
    warnBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: ui.accentBorder,
      backgroundColor: ui.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    warnBtnOn: {
      backgroundColor: ui.accent,
      borderColor: ui.accent,
    },
    qtyRow: { marginTop: 12, flexDirection: "row", gap: 12 },
    qtyCol: { flex: 1 },
    qtyColInput: { maxWidth: 120 },
    qtyLbl: {
      fontSize: 11,
      fontWeight: "700",
      color: ui.faint,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 6,
    },
    qtyExpected: { fontSize: 22, fontWeight: "800", color: ui.ink },
    input: {
      borderWidth: 1,
      borderColor: ui.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 20,
      fontWeight: "800",
      color: ui.ink,
      backgroundColor: ui.field,
    },
    inputWarn: {
      borderColor: ui.accent,
      backgroundColor: ui.accentSoft,
    },
    inputLocked: {
      opacity: 0.85,
    },
    incidentLink: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: ui.accentBorder,
      backgroundColor: ui.accentSoft,
    },
    incidentLinkTxt: {
      flex: 1,
      fontSize: 13,
      fontWeight: "800",
      color: ui.accentInk,
    },
    incidentSummary: {
      marginTop: 10,
      padding: 10,
      borderRadius: 10,
      backgroundColor: ui.surface,
      borderWidth: 1,
      borderColor: ui.accentBorder,
    },
    incidentSummaryTxt: {
      fontSize: 12,
      fontWeight: "800",
      color: ui.accentInkStrong,
    },
    incidentComment: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: "600",
      color: ui.accentInk,
    },
    warn: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: "700",
      color: ui.accentInk,
    },
    badgeRow: { marginTop: 10 },
    badgeConfirmed: { fontSize: 12, fontWeight: "800", color: ui.green },
    badgeWarehouse: { fontSize: 12, fontWeight: "800", color: ui.muted },
    pendingWrap: {
      marginTop: 4,
      marginBottom: 8,
      padding: 14,
      borderRadius: 12,
      backgroundColor: ui.accentSoft,
      borderWidth: 1,
      borderColor: ui.accentBorder,
    },
    pendingTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: ui.accentInkStrong,
      marginBottom: 6,
    },
    pendingItem: {
      fontSize: 13,
      fontWeight: "600",
      color: ui.accentInk,
      lineHeight: 18,
    },
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
      backgroundColor: ui.accent,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    dockBtnDisabled: { opacity: 0.55 },
    dockBtnTxt: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  });
}
