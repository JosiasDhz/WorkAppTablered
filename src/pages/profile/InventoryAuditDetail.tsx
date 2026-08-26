import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {
  ArrowRight2,
  Box,
  Building,
  Calendar,
  Lock,
  TickCircle,
  User,
} from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { PageFlipReveal } from "../../components/PageFlipReveal";
import { SoftPressable } from "../../components/SoftPressable";
import { SlideToStartAudit } from "../../components/SlideToStartAudit";
import { headerSafeEdges } from "../../routes/headerSafeEdges";
import { SCREEN_GUTTER } from "../../theme/layout";
import {
  getAuditCostReport,
  getMyAuditSummary,
  startMyAudit,
  auditFamilyDisplayLabel,
  type AuditCostReport,
  type AuditDetailFamily,
  type MyAuditDetail,
} from "../../services/inventoryAuditService";
import {
  formatInventoryAuditCalendarDateMX,
  parseInventoryAuditCalendarDate,
} from "../../utils/auditCalendarDates";
import { AUDIT_UI, auditSoftCardStyle } from "./audit/auditUi";

const FLIP_STAGGER_MS = 70;

function clampFlipDelay(delay: number) {
  return Math.min(700, delay);
}

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

function auditStatusMeta(status: string) {
  if (status === "pending") {
    return { label: "Pendiente", color: AUDIT_UI.amber, soft: AUDIT_UI.amberSoft };
  }
  if (status === "in_progress") {
    return { label: "En curso", color: AUDIT_UI.accent, soft: AUDIT_UI.accentSoft };
  }
  if (status === "finalized" || status === "completed") {
    return { label: "Finalizada", color: AUDIT_UI.green, soft: AUDIT_UI.greenSoft };
  }
  if (status === "pending_review" || status === "pending_responsibility" || status === "submitted") {
    return { label: "En revisión", color: AUDIT_UI.blue, soft: AUDIT_UI.blueSoft };
  }
  return { label: status, color: AUDIT_UI.muted, soft: AUDIT_UI.field };
}

function familyStatusMeta(status: string, locked: boolean) {
  if (locked) {
    return { label: "Bloqueada", color: AUDIT_UI.muted, soft: AUDIT_UI.field };
  }
  if (status === "completed") {
    return { label: "Completada", color: AUDIT_UI.green, soft: AUDIT_UI.greenSoft };
  }
  if (status === "in_progress") {
    return { label: "En curso", color: AUDIT_UI.accent, soft: AUDIT_UI.accentSoft };
  }
  return { label: "Pendiente", color: AUDIT_UI.amber, soft: AUDIT_UI.amberSoft };
}

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const width = `${Math.max(0, Math.min(100, progress))}%` as `${number}%`;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width, backgroundColor: color }]} />
    </View>
  );
}

function StatTile({
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
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        <Text style={styles.statTotal}>/{total}</Text>
      </Text>
      <ProgressBar progress={progress} color={color} />
      <Text style={[styles.statPct, { color }]}>{progress}%</Text>
    </View>
  );
}

function FamilyCard({
  family,
  index,
  locked,
  onPress,
}: {
  family: AuditDetailFamily;
  index: number;
  locked: boolean;
  onPress: () => void;
}) {
  const pct =
    family.totalProducts > 0
      ? Math.round((family.countedProducts / family.totalProducts) * 100)
      : 0;
  const done = family.status === "completed";
  const meta = familyStatusMeta(family.status, locked);
  const dept = family.departament?.name ?? "Ubicación";
  const label = auditFamilyDisplayLabel(family);

  const body = (
    <View style={[styles.familyCard, locked ? styles.familyCardLocked : null]}>
      <View style={styles.familyTop}>
        <View style={[styles.iconWell, { backgroundColor: meta.soft }]}>
          {done && !locked ? (
            <TickCircle size={20} color={meta.color} variant="Bold" />
          ) : locked ? (
            <Lock size={18} color={meta.color} variant="Linear" />
          ) : (
            <Text style={[styles.stopNum, { color: meta.color }]}>{index + 1}</Text>
          )}
        </View>
        <View style={styles.familyCopy}>
          <View style={styles.familyTitleRow}>
            <Text style={styles.familyTitle} numberOfLines={1}>
              {dept}
            </Text>
            <View style={[styles.badge, { backgroundColor: meta.soft }]}>
              <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>
          <Text style={styles.familySub} numberOfLines={2}>
            {label}
          </Text>
          <Text style={styles.familyMeta}>
            {family.countedProducts}/{family.totalProducts} productos
          </Text>
        </View>
        {locked ? null : <ArrowRight2 size={16} color={AUDIT_UI.muted} variant="Linear" />}
      </View>
      <View style={styles.familyProgress}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Avance</Text>
          <Text style={[styles.progressValue, { color: meta.color }]}>{pct}%</Text>
        </View>
        <ProgressBar progress={pct} color={meta.color} />
      </View>
    </View>
  );

  if (locked) {
    return body;
  }

  return (
    <SoftPressable onPress={onPress} scaleTo={0.99} accessibilityLabel={label}>
      {body}
    </SoftPressable>
  );
}

export default function InventoryAuditDetail() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
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
    if (
      (detail?.status === "finalized" || detail?.status === "pending_responsibility") &&
      auditId
    ) {
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
      locationLabel: auditFamilyDisplayLabel(f),
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

  const families = detail?.families ?? [];
  const familiesDone = useMemo(
    () => families.filter((f) => f.status === "completed").length,
    [families],
  );
  const familiesPct =
    families.length > 0 ? Math.round((familiesDone / families.length) * 100) : 0;
  const productsPct =
    detail && detail.totalProducts > 0
      ? Math.round((detail.countedProducts / detail.totalProducts) * 100)
      : 0;

  const statusMeta = detail ? auditStatusMeta(detail.status) : null;
  const warehouseName = detail?.warehouse?.name?.trim() || "Auditoría";
  const workerName = detail?.worker?.user
    ? [detail.worker.user.name, detail.worker.user.lastName].filter(Boolean).join(" ")
    : null;
  const dateRange = detail
    ? `${formatInventoryAuditCalendarDateMX(detail.scheduledStartDate)} → ${formatInventoryAuditCalendarDateMX(detail.scheduledEndDate)}`
    : "";

  const headerSubtitle = familiesLocked
    ? "Desliza para iniciar y desbloquear ubicaciones"
    : "Elige una ubicación para continuar el conteo";

  return (
    <SafeAreaView style={styles.safe} edges={headerSafeEdges("top", "left", "right")}>
      <HeaderTitle
        title={warehouseName}
        subtitle={headerSubtitle}
        tone="light"
        style={styles.header}
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AUDIT_UI.accent} />
        </View>
      ) : error ? (
        <View style={styles.pad}>
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <SoftPressable style={styles.retryBtn} onPress={load} scaleTo={0.98}>
            <Text style={styles.retryText}>Reintentar</Text>
          </SoftPressable>
        </View>
      ) : detail ? (
        <View style={styles.detailBody}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              showStartDock && styles.scrollContentDock,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={AUDIT_UI.accent}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <PageFlipReveal delay={0} active={isFocused}>
              <View style={styles.heroCard}>
                <View style={styles.heroRow}>
                  <View style={[styles.heroIcon, { backgroundColor: statusMeta?.soft }]}>
                    <Building size={22} color={statusMeta?.color} variant="Linear" />
                  </View>
                  <View style={styles.heroText}>
                    <Text style={styles.heroTitle} numberOfLines={1}>
                      {warehouseName}
                    </Text>
                    <Text style={styles.heroSub} numberOfLines={2}>
                      {families.length} ubicación{families.length === 1 ? "" : "es"} ·{" "}
                      {detail.totalProducts} productos
                    </Text>
                  </View>
                  {statusMeta ? (
                    <View style={[styles.badge, { backgroundColor: statusMeta.soft }]}>
                      <Text style={[styles.badgeText, { color: statusMeta.color }]}>
                        {statusMeta.label}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.metaList}>
                  <View style={styles.metaRow}>
                    <Calendar size={15} color={AUDIT_UI.muted} variant="Linear" />
                    <Text style={styles.metaText}>{dateRange}</Text>
                  </View>
                  {workerName ? (
                    <View style={styles.metaRow}>
                      <User size={15} color={AUDIT_UI.muted} variant="Linear" />
                      <Text style={styles.metaText}>{workerName}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </PageFlipReveal>

            <PageFlipReveal delay={FLIP_STAGGER_MS} active={isFocused}>
              <View style={styles.statsRow}>
                <StatTile
                  label="Ubicaciones"
                  value={familiesDone}
                  total={families.length}
                  progress={familiesPct}
                  color={AUDIT_UI.green}
                />
                <StatTile
                  label="Productos"
                  value={detail.countedProducts}
                  total={detail.totalProducts}
                  progress={productsPct}
                  color={AUDIT_UI.accent}
                />
              </View>
            </PageFlipReveal>

            {familiesLocked ? (
              <PageFlipReveal delay={FLIP_STAGGER_MS * 2} active={isFocused}>
                <View style={styles.lockBanner}>
                  <View style={[styles.iconWell, { backgroundColor: AUDIT_UI.amberSoft }]}>
                    <Lock size={18} color={AUDIT_UI.amber} variant="Linear" />
                  </View>
                  <View style={styles.lockCopy}>
                    <Text style={styles.lockTitle}>Ubicaciones bloqueadas</Text>
                    <Text style={styles.lockSub}>
                      {scheduleWindow === "before"
                        ? "Aún no inicia el periodo programado."
                        : scheduleWindow === "after"
                          ? "El periodo programado ya terminó."
                          : "Desliza abajo para iniciar la auditoría."}
                    </Text>
                  </View>
                </View>
              </PageFlipReveal>
            ) : null}

            <View style={styles.sectionBlock}>
              <PageFlipReveal
                delay={clampFlipDelay(FLIP_STAGGER_MS * 3)}
                active={isFocused}
              >
                <Text style={styles.sectionTitle}>
                  Ubicaciones
                  {families.length > 0 ? ` · ${families.length}` : ""}
                </Text>
              </PageFlipReveal>

              <View style={styles.list}>
                {families.map((f, index) => (
                  <PageFlipReveal
                    key={f.id}
                    delay={clampFlipDelay((index + 4) * FLIP_STAGGER_MS)}
                    active={isFocused}
                  >
                    <FamilyCard
                      family={f}
                      index={index}
                      locked={familiesLocked}
                      onPress={() => goFamily(f)}
                    />
                  </PageFlipReveal>
                ))}
                {families.length === 0 ? (
                  <View style={styles.emptyBlock}>
                    <View style={[styles.emptyWell, { backgroundColor: AUDIT_UI.accentSoft }]}>
                      <Box size={26} color={AUDIT_UI.accent} variant="Linear" />
                    </View>
                    <Text style={styles.emptyTitle}>Sin ubicaciones</Text>
                    <Text style={styles.emptySub}>
                      Esta auditoría todavía no tiene familias asignadas.
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {auditReadOnly &&
            (detail.status === "finalized" || detail.status === "pending_responsibility") ? (
              <PageFlipReveal
                delay={clampFlipDelay(FLIP_STAGGER_MS * 5)}
                active={isFocused}
              >
                <View style={styles.resultsCard}>
                  <Text style={styles.resultsTitle}>Resultados finales</Text>
                  {loadingCostReport ? (
                    <ActivityIndicator color={AUDIT_UI.accent} />
                  ) : costReport ? (
                    <View style={styles.resultsRows}>
                      <View style={styles.resultsRow}>
                        <Text style={styles.resultsLabel}>Pérdidas</Text>
                        <Text style={styles.resultsValue}>
                          {fmtMXN(costReport.totalLoss)}
                        </Text>
                      </View>
                      <View style={styles.resultsRow}>
                        <Text style={styles.resultsLabel}>Neto</Text>
                        <Text
                          style={[
                            styles.resultsValue,
                            costReport.totalLoss > 0 ? styles.resultsLoss : null,
                          ]}
                        >
                          {fmtMXN(
                            costReport.totalLoss > 0
                              ? -Math.abs(costReport.totalLoss)
                              : 0,
                          )}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.resultsEmpty}>Sin reporte de costos.</Text>
                  )}
                </View>
              </PageFlipReveal>
            ) : null}
          </ScrollView>

          {showStartDock ? (
            <View
              style={[
                styles.startDock,
                { paddingBottom: Math.max(insets.bottom, 10) + 8 },
              ]}
            >
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
  safe: { flex: 1, backgroundColor: "transparent" },
  header: { paddingHorizontal: SCREEN_GUTTER },
  detailBody: { flex: 1 },
  startDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SCREEN_GUTTER,
    backgroundColor: "transparent",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  pad: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 8 },
  scrollContent: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },
  scrollContentDock: { paddingBottom: 150 },
  errorBanner: {
    backgroundColor: AUDIT_UI.roseSoft,
    borderRadius: 14,
    padding: 12,
  },
  errorText: { fontSize: 13, fontWeight: "600", color: AUDIT_UI.rose },
  retryBtn: {
    marginTop: 16,
    backgroundColor: AUDIT_UI.accent,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  retryText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  heroCard: {
    ...auditSoftCardStyle(),
    padding: 14,
    gap: 12,
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
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { flex: 1, minWidth: 0 },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AUDIT_UI.ink,
  },
  heroSub: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: AUDIT_UI.muted,
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
  metaList: { gap: 8 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: AUDIT_UI.muted,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statTile: {
    ...auditSoftCardStyle(),
    flex: 1,
    padding: 14,
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: AUDIT_UI.muted,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: AUDIT_UI.ink,
  },
  statTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: AUDIT_UI.muted,
  },
  statPct: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: AUDIT_UI.field,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  lockBanner: {
    ...auditSoftCardStyle(),
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  lockCopy: { flex: 1, minWidth: 0 },
  lockTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: AUDIT_UI.ink,
  },
  lockSub: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
    color: AUDIT_UI.muted,
    lineHeight: 18,
  },
  sectionBlock: { gap: 10 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: AUDIT_UI.ink,
  },
  list: { gap: 10 },
  familyCard: {
    ...auditSoftCardStyle(),
    padding: 14,
    gap: 12,
  },
  familyCardLocked: { opacity: 0.88 },
  familyTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stopNum: {
    fontSize: 15,
    fontWeight: "800",
  },
  familyCopy: { flex: 1, minWidth: 0 },
  familyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  familyTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "700",
    color: AUDIT_UI.ink,
  },
  familySub: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "500",
    color: AUDIT_UI.muted,
    lineHeight: 18,
  },
  familyMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
    color: AUDIT_UI.muted,
  },
  familyProgress: { gap: 6 },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: AUDIT_UI.muted,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "800",
  },
  emptyBlock: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyWell: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AUDIT_UI.ink,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: "500",
    color: AUDIT_UI.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  resultsCard: {
    ...auditSoftCardStyle(),
    padding: 14,
    gap: 12,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: AUDIT_UI.ink,
  },
  resultsRows: { gap: 10 },
  resultsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultsLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: AUDIT_UI.muted,
  },
  resultsValue: {
    fontSize: 15,
    fontWeight: "700",
    color: AUDIT_UI.ink,
  },
  resultsLoss: { color: AUDIT_UI.rose },
  resultsEmpty: {
    fontSize: 13,
    fontWeight: "500",
    color: AUDIT_UI.muted,
  },
});
