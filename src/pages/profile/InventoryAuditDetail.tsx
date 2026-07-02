import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import Svg, { Circle } from "react-native-svg";
import { ArrowRight2, Building, Calendar, Lock, User } from "iconsax-react-native";
import { ProfileScreenHeader } from "../../components/ProfileScreenHeader";
import { SlideToStartAudit } from "../../components/SlideToStartAudit";
import {
  getAuditCostReport,
  getMyAuditSummary,
  startMyAudit,
  type AuditCostReport,
  type AuditDetailFamily,
  type MyAuditDetail,
} from "../../services/inventoryAuditService";
import {
  formatInventoryAuditCalendarDateMX,
  parseInventoryAuditCalendarDate,
} from "../../utils/auditCalendarDates";

const COLORS = {
  bg: "#F7F7F6",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  border: "#E5E7EB",
  accent: "#EA7600",
  blue: "#2563EB",
};

function formatApiError(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (Array.isArray(o.message)) return o.message.map(String).join(", ");
  }
  return "No se pudo cargar el detalle.";
}

function fmtMXN(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(n);
}

function getScheduleWindow(
  scheduledStartDate: string,
  scheduledEndDate: string,
): "before" | "during" | "after" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = parseInventoryAuditCalendarDate(scheduledStartDate);
  s.setHours(0, 0, 0, 0);
  const e = parseInventoryAuditCalendarDate(scheduledEndDate);
  e.setHours(0, 0, 0, 0);
  if (today < s) return "before";
  if (today > e) return "after";
  return "during";
}

function SummaryRing({
  label,
  value,
  total,
  progress,
  color,
}: {
  label: string;
  value: number;
  total: number;
  progress: number;
  color: string;
}) {
  const size = 84;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringProgress = Math.max(0, Math.min(100, progress));
  const strokeDashoffset = circumference * (1 - ringProgress / 100);

  return (
    <View style={styles.summaryRingCol}>
      <Text style={styles.summaryRingLabel}>{label}</Text>
      <View style={styles.summaryRingWrap}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#D9DEE7" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <Text style={styles.summaryRingValue}>
          {value}
          <Text style={styles.summaryRingValueMuted}>/{total}</Text>
        </Text>
      </View>
    </View>
  );
}

export default function InventoryAuditDetail() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { auditId } = route.params as { auditId: string };

  const [detail, setDetail] = useState<MyAuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [costReport, setCostReport] = useState<AuditCostReport | null>(null);
  const [loadingCostReport, setLoadingCostReport] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setStartError(null);
    try {
      const data = await getMyAuditSummary(auditId);
      setDetail(data);
    } catch (e: unknown) {
      setError(formatApiError(e));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [auditId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  useEffect(() => {
    if ((detail?.status === "finalized" || detail?.status === "pending_responsibility") && auditId) {
      setLoadingCostReport(true);
      getAuditCostReport(auditId)
        .then(setCostReport)
        .catch(() => setCostReport(null))
        .finally(() => setLoadingCostReport(false));
    }
  }, [detail?.status, auditId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const familiesLocked = detail ? detail.status === "pending" : false;
  const auditReadOnly =
    detail &&
    (detail.status === "pending_review" ||
      detail.status === "pending_responsibility" ||
      detail.status === "finalized" ||
      detail.status === "completed" ||
      detail.status === "submitted");

  const scheduleWindow = detail
    ? getScheduleWindow(detail.scheduledStartDate, detail.scheduledEndDate)
    : "during";

  const goFamily = (f: AuditDetailFamily) => {
    if (familiesLocked) return;
    navigation.navigate("InventoryAuditFamilyProducts", {
      auditId,
      familyId: f.id,
      deptName: f.departament?.name,
      brandName: f.brand?.name,
    });
  };

  const confirmStartAudit = useCallback(async () => {
    setStartError(null);
    setStarting(true);
    try {
      const updated = await startMyAudit(auditId);
      setDetail(updated);
      Toast.show({
        type: "success",
        text1: "Auditoría iniciada",
        text2: "Se ha iniciado la auditoría.",
        position: "top",
      });
    } catch (e: unknown) {
      setStartError(formatApiError(e));
    } finally {
      setStarting(false);
    }
  }, [auditId]);

  const showStartDock = !!detail && familiesLocked && scheduleWindow === "during";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ProfileScreenHeader title="Detalle de auditoría" subtitle="Elige una ubicación para revisar o retomar" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : error ? (
        <View style={styles.pad}>
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : detail ? (
        <View style={styles.detailBody}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, showStartDock && styles.scrollContentDock]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
            }
          >
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen</Text>
              <View style={styles.summaryRingsRow}>
                <SummaryRing
                  label="UBICACIONES"
                  value={(detail.families ?? []).filter((f) => f.status === "completed").length}
                  total={detail.families?.length ?? 0}
                  progress={
                    (detail.families?.length ?? 0) > 0
                      ? Math.round(
                          (((detail.families ?? []).filter((f) => f.status === "completed").length /
                            (detail.families?.length ?? 0)) *
                            100),
                        )
                      : 0
                  }
                  color="#33B15E"
                />
                <SummaryRing
                  label="PRODUCTOS"
                  value={detail.countedProducts}
                  total={detail.totalProducts}
                  progress={
                    detail.totalProducts > 0
                      ? Math.round((detail.countedProducts / detail.totalProducts) * 100)
                      : 0
                  }
                  color="#2F7DE1"
                />
              </View>
              <View style={styles.summaryInfoCard}>
                <Calendar size={14} color="#64748B" variant="Linear" />
                <Text style={styles.summaryInfoText}>
                  {formatInventoryAuditCalendarDateMX(detail.scheduledStartDate)} →{" "}
                  {formatInventoryAuditCalendarDateMX(detail.scheduledEndDate)}
                </Text>
              </View>
              {detail.warehouse?.name ? (
                <View style={styles.summaryInfoCard}>
                  <Building size={14} color="#64748B" variant="Linear" />
                  <Text style={styles.summaryInfoText}>{detail.warehouse.name}</Text>
                </View>
              ) : null}
              {detail.worker?.user ? (
                <View style={styles.summaryInfoCard}>
                  <User size={14} color="#64748B" variant="Linear" />
                  <Text style={styles.summaryInfoText}>
                    {[detail.worker.user.name, detail.worker.user.lastName].filter(Boolean).join(" ")}
                  </Text>
                </View>
              ) : null}
            </View>

            {(detail.families ?? []).map((f) => {
              const pct = f.totalProducts > 0 ? Math.round((f.countedProducts / f.totalProducts) * 100) : 0;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.familyRow, familiesLocked && styles.familyRowLocked]}
                  activeOpacity={familiesLocked ? 1 : 0.88}
                  onPress={() => goFamily(f)}
                  disabled={familiesLocked}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.familyDept}>{f.departament?.name ?? "—"}</Text>
                    <Text style={styles.familyBrand}>{f.brand?.name ?? "—"}</Text>
                    <Text style={styles.familyMeta}>{f.countedProducts}/{f.totalProducts} contados · {pct}%</Text>
                  </View>
                  {familiesLocked ? (
                    <Lock size={16} color="#9CA3AF" variant="Linear" />
                  ) : (
                    <ArrowRight2 size={16} color={COLORS.blue} variant="Linear" />
                  )}
                </TouchableOpacity>
              );
            })}

            {auditReadOnly && (detail?.status === "finalized" || detail?.status === "pending_responsibility") ? (
              <View style={styles.resultsCard}>
                <Text style={styles.resultsTitle}>Resultados finales</Text>
                {loadingCostReport ? (
                  <ActivityIndicator color={COLORS.accent} />
                ) : costReport ? (
                  <>
                    <Text style={styles.resultsLine}>Pérdidas: {fmtMXN(costReport.totalLoss)}</Text>
                    <Text style={styles.resultsLine}>
                      Neto:{" "}
                      {fmtMXN(
                        costReport.totalLoss > 0 ? -Math.abs(costReport.totalLoss) : 0,
                      )}
                    </Text>
                  </>
                ) : null}
              </View>
            ) : null}
          </ScrollView>

          {showStartDock ? (
            <View style={[styles.startDock, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}>
              <SlideToStartAudit
                inDock
                onSlideComplete={confirmStartAudit}
                busy={starting}
                errorToken={startError}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  detailBody: { flex: 1 },
  startDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  pad: { padding: 20 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  scrollContentDock: { paddingBottom: 150 },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 12,
  },
  errorText: { fontSize: 13, color: "#B91C1C" },
  retryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  retryText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  summaryTitle: { fontSize: 14, fontWeight: "900", color: COLORS.text, marginBottom: 10 },
  summaryRingsRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 12 },
  summaryRingCol: { flex: 1, alignItems: "center" },
  summaryRingLabel: { fontSize: 10, fontWeight: "900", color: COLORS.muted, marginBottom: 6 },
  summaryRingWrap: { width: 84, height: 84, alignItems: "center", justifyContent: "center" },
  summaryRingValue: { position: "absolute", fontSize: 14, fontWeight: "900", color: COLORS.text },
  summaryRingValueMuted: { fontSize: 10, color: COLORS.muted },
  summaryInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
  summaryInfoText: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  familyRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  familyRowLocked: { opacity: 0.72, backgroundColor: "#F9FAFB" },
  familyDept: { fontSize: 14, fontWeight: "900", color: COLORS.text },
  familyBrand: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  familyMeta: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
  resultsCard: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  resultsTitle: { fontSize: 14, fontWeight: "900", color: "#047857", marginBottom: 8 },
  resultsLine: { fontSize: 13, color: "#065F46", marginBottom: 3, fontWeight: "700" },
});
