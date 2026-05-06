import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ProfileScreenHeader } from "../../components/ProfileScreenHeader";
import { ArrowDown2, ArrowUp2, Box, Calendar } from "iconsax-react-native";
import Svg, { Circle } from "react-native-svg";
import { BlurView } from "expo-blur";
import {
  getMyAudits,
  type MyInventoryAudit,
  type MyInventoryAuditFamily,
} from "../../services/inventoryAuditService";
import { formatInventoryAuditCalendarDateMX } from "../../utils/auditCalendarDates";

const COLORS = {
  bg: "#F6F8FB",
  surface: "#FFFFFF",
  text: "#0B1220",
  muted: "#5A6478",
  border: "#E4EAF2",
  accent: "#EA7600",
  accentDark: "#C45F00",
  accentGlow: "#FFF0E5",
  blue: "#1D4ED8",
  blueSoft: "#DBEAFE",
  green: "#16A34A",
  greenDark: "#047857",
  greenSoft: "#ECFDF5",
  greenMuted: "#059669",
  red: "#DC2626",
  purple: "#7C3AED",
  amber: "#D97706",
  ink: "#1E293B",
};

const PAGE_SIZE = 10;

const FINALIZED_AUDIT_STATUSES = new Set<MyInventoryAudit["status"]>([
  "finalized",
  "pending_responsibility",
]);

function isFinalizedAudit(audit: MyInventoryAudit) {
  return FINALIZED_AUDIT_STATUSES.has(audit.status);
}

type AuditListRow =
  | { kind: "audit"; audit: MyInventoryAudit; section: "finalized" | "in_progress" | "pending" }
  | { kind: "finalizedHeader" }
  | { kind: "inProgressHeader" }
  | { kind: "pendingHeader" };

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatApiError(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (Array.isArray(o.message)) return o.message.map(String).join(", ");
  }
  return "No se pudieron cargar las auditorías.";
}

function familyBrandLabel(fam: MyInventoryAuditFamily) {
  return fam.brand?.name ?? "—";
}

function finalizedDateText(audit: MyInventoryAudit) {
  if (audit.workerFinishedAt) return formatDateShort(audit.workerFinishedAt);
  return formatInventoryAuditCalendarDateMX(audit.scheduledEndDate);
}

function MetricRing({
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
  const size = 94;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringProgress = Math.max(0, Math.min(100, progress));
  const strokeDashoffset = circumference * (1 - ringProgress / 100);

  return (
    <View style={styles.ringCol}>
      <Text style={styles.ringLabel}>{label}</Text>
      <View style={styles.ringWrap}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#D9DEE7"
            strokeWidth={stroke}
            fill="none"
          />
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
        <View style={styles.ringCenterGlow} />
        <Text style={styles.ringValue}>
          {value}
          <Text style={styles.ringValueMuted}>/{total}</Text>
        </Text>
      </View>
    </View>
  );
}

function AuditCard({
  audit,
  section,
}: {
  audit: MyInventoryAudit;
  section: "finalized" | "in_progress" | "pending";
}) {
  const showFinalizedDate = isFinalizedAudit(audit);
  const topAccentColor = showFinalizedDate
    ? COLORS.greenMuted
    : audit.status === "in_progress"
      ? COLORS.blue
      : COLORS.accent;
  const families = audit.families ?? [];
  const familiesTotal = families.length;
  const familiesDone = families.filter((f) => f.status === "completed").length;
  const familiesPct =
    familiesTotal > 0 ? Math.round((familiesDone / familiesTotal) * 100) : 0;
  const productsPct =
    audit.totalProducts > 0
      ? Math.round((audit.countedProducts / audit.totalProducts) * 100)
      : 0;

  return (
    <BlurView
      intensity={35}
      tint="light"
      experimentalBlurMethod="dimezisBlurView"
      style={[styles.card, { borderTopColor: topAccentColor }]}
    >
      {section === "pending" ? (
        <View style={styles.pendingTotalsRow}>
          <View style={styles.pendingTotalCard}>
            <Text style={styles.pendingTotalLabel}>FAMILIAS</Text>
            <Text style={styles.pendingTotalValue}>{familiesTotal}</Text>
          </View>
          <View style={styles.pendingTotalCard}>
            <Text style={styles.pendingTotalLabel}>PRODUCTOS</Text>
            <Text style={styles.pendingTotalValue}>{audit.totalProducts}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.ringsRow}>
          <MetricRing
            label="FAMILIAS"
            value={familiesDone}
            total={familiesTotal}
            progress={familiesPct}
            color="#33B15E"
          />
          <MetricRing
            label="PRODUCTOS"
            value={audit.countedProducts}
            total={audit.totalProducts}
            progress={productsPct}
            color="#2F7DE1"
          />
        </View>
      )}

      {familiesTotal > 0 ? (
        <View style={styles.chipsSection}>
          <Text style={styles.chipsSectionLabel}>Marcas</Text>
          <View style={styles.chipsRow}>
            {families.slice(0, 3).map((fam, idx) => (
              <View key={fam.id} style={[styles.chip, idx === 0 && styles.chipPrimary]}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {familyBrandLabel(fam)}
                </Text>
              </View>
            ))}
            {familiesTotal > 3 ? (
              <View style={styles.chip}>
                <Text style={styles.chipMore}>+{familiesTotal - 3} más</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {showFinalizedDate ? (
        <View style={styles.cardFinalizedFooter}>
          <Text style={styles.cardFinalizedDate}>
            Finalizada el {finalizedDateText(audit)}
          </Text>
        </View>
      ) : (
        <View style={styles.cardDateFooter}>
          <View style={styles.cardDateIconWrap}>
            <Calendar size={12} color="#64748B" variant="Linear" />
          </View>
          <View style={styles.cardDateTextCol}>
            <Text style={styles.cardDateLabel}>VENTANA</Text>
            <Text style={styles.cardDateRange}>
              {formatInventoryAuditCalendarDateMX(audit.scheduledStartDate)} {"→"}{" "}
              {formatInventoryAuditCalendarDateMX(audit.scheduledEndDate)}
            </Text>
          </View>
        </View>
      )}
    </BlurView>
  );
}

function ListSkeleton() {
  const animated = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animated, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(animated, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated]);
  const opacity = animated.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.92] });

  return (
    <View style={{ paddingTop: 8 }}>
      {[0, 1, 2, 3].map((i) => (
        <Animated.View key={i} style={[styles.skeletonCard, { opacity }]}>
          <View style={styles.skeletonStats} />
        </Animated.View>
      ))}
    </View>
  );
}

export default function InventoryAudit() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<MyInventoryAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalizedSectionExpanded, setFinalizedSectionExpanded] = useState(false);
  const [inProgressSectionExpanded, setInProgressSectionExpanded] = useState(true);
  const [activeSectionExpanded, setActiveSectionExpanded] = useState(true);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const reloadFirstPage = useCallback(async () => {
    const res = await getMyAudits({
      limit: PAGE_SIZE,
      offset: 0,
    });
    setItems(res.data);
    offsetRef.current = res.data.length;
    hasMoreRef.current = offsetRef.current < res.total;
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setError(null);
      setLoading(true);
      offsetRef.current = 0;
      hasMoreRef.current = true;
      loadingMoreRef.current = false;
      (async () => {
        try {
          const res = await getMyAudits({
            limit: PAGE_SIZE,
            offset: 0,
          });
          if (!active) return;
          setItems(res.data);
          offsetRef.current = res.data.length;
          hasMoreRef.current = offsetRef.current < res.total;
        } catch (e: unknown) {
          if (!active) return;
          setError(formatApiError(e));
          setItems([]);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await reloadFirstPage();
    } catch (e: unknown) {
      setError(formatApiError(e));
    } finally {
      setRefreshing(false);
    }
  }, [reloadFirstPage]);

  const onEndReached = useCallback(async () => {
    if (!hasMoreRef.current || loading || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await getMyAudits({
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      });
      setItems((prev) => [...prev, ...res.data]);
      offsetRef.current += res.data.length;
      hasMoreRef.current = offsetRef.current < res.total;
    } catch {
      // Keep current list
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [loading]);

  const toggleFinalizedSection = useCallback(() => {
    setFinalizedSectionExpanded((v) => !v);
  }, []);
  const toggleInProgressSection = useCallback(() => {
    setInProgressSectionExpanded((v) => !v);
  }, []);
  const toggleActiveSection = useCallback(() => {
    setActiveSectionExpanded((v) => !v);
  }, []);

  const { inProgressAudits, pendingAudits, finalizedAudits } = useMemo(() => {
    const inProgress: MyInventoryAudit[] = [];
    const pending: MyInventoryAudit[] = [];
    const finalized: MyInventoryAudit[] = [];
    for (const a of items) {
      if (isFinalizedAudit(a)) finalized.push(a);
      else if (a.status === "in_progress") inProgress.push(a);
      else pending.push(a);
    }
    return { inProgressAudits: inProgress, pendingAudits: pending, finalizedAudits: finalized };
  }, [items]);

  const listRows = useMemo((): AuditListRow[] => {
    const rows: AuditListRow[] = [];
    if (inProgressAudits.length > 0) {
      rows.push({ kind: "inProgressHeader" });
      if (inProgressSectionExpanded) {
        for (const audit of inProgressAudits) {
          rows.push({ kind: "audit", audit, section: "in_progress" });
        }
      }
    }
    if (pendingAudits.length > 0) {
      rows.push({ kind: "pendingHeader" });
      if (activeSectionExpanded) {
        for (const audit of pendingAudits) {
          rows.push({ kind: "audit", audit, section: "pending" });
        }
      }
    }
    if (finalizedAudits.length > 0) {
      rows.push({ kind: "finalizedHeader" });
      if (finalizedSectionExpanded) {
        for (const audit of finalizedAudits) {
          rows.push({ kind: "audit", audit, section: "finalized" });
        }
      }
    }
    return rows;
  }, [
    inProgressAudits,
    pendingAudits,
    finalizedAudits,
    finalizedSectionExpanded,
    inProgressSectionExpanded,
    activeSectionExpanded,
  ]);

  const listHeader = (
    <View>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ProfileScreenHeader
        title="Auditorías de inventario"
        subtitle="Toca una auditoría para ver familias y conteos"
        backgroundColor={COLORS.bg}
      />

      {loading ? (
        <View style={styles.listPad}>
          {listHeader}
          <ListSkeleton />
        </View>
      ) : (
        <FlatList
          data={listRows}
          keyExtractor={(item) => {
            if (item.kind === "audit") return item.audit.id;
            if (item.kind === "finalizedHeader") return "finalized-audits-section-header";
            if (item.kind === "inProgressHeader") return "in-progress-audits-section-header";
            return "pending-audits-section-header";
          }}
          renderItem={({ item }) => {
            if (item.kind === "finalizedHeader") {
              return (
                <TouchableOpacity
                  style={styles.finalizedSectionHeader}
                  onPress={toggleFinalizedSection}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: finalizedSectionExpanded }}
                  accessibilityLabel={
                    finalizedSectionExpanded
                      ? "Ocultar auditorías con estado Finalizada"
                      : "Mostrar auditorías con estado Finalizada"
                  }
                >
                  <View style={styles.finalizedSectionHeaderLeft}>
                    {finalizedSectionExpanded ? (
                      <ArrowUp2 size={18} color={COLORS.greenMuted} variant="Bold" />
                    ) : (
                      <ArrowDown2 size={18} color={COLORS.greenMuted} variant="Bold" />
                    )}
                    <View style={styles.finalizedSectionTitleCol}>
                      <Text style={styles.finalizedSectionTitle}>Auditorías finalizadas</Text>
                    </View>
                  </View>
                  <View style={styles.finalizedSectionCountBadge}>
                    <Text style={styles.finalizedSectionCountText}>{finalizedAudits.length}</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            if (item.kind === "inProgressHeader") {
              return (
                <TouchableOpacity
                  style={styles.finalizedSectionHeader}
                  onPress={toggleInProgressSection}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: inProgressSectionExpanded }}
                  accessibilityLabel={
                    inProgressSectionExpanded
                      ? "Ocultar auditorías en curso"
                      : "Mostrar auditorías en curso"
                  }
                >
                  <View style={styles.finalizedSectionHeaderLeft}>
                    {inProgressSectionExpanded ? (
                      <ArrowUp2 size={18} color={COLORS.blue} variant="Bold" />
                    ) : (
                      <ArrowDown2 size={18} color={COLORS.blue} variant="Bold" />
                    )}
                    <View style={styles.finalizedSectionTitleCol}>
                      <Text style={styles.finalizedSectionTitle}>Auditorías en curso</Text>
                    </View>
                  </View>
                  <View style={styles.inProgressSectionCountBadge}>
                    <Text style={styles.inProgressSectionCountText}>{inProgressAudits.length}</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            if (item.kind === "pendingHeader") {
              return (
                <TouchableOpacity
                  style={styles.finalizedSectionHeader}
                  onPress={toggleActiveSection}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: activeSectionExpanded }}
                  accessibilityLabel={
                    activeSectionExpanded
                      ? "Ocultar auditorías pendientes"
                      : "Mostrar auditorías pendientes"
                  }
                >
                  <View style={styles.finalizedSectionHeaderLeft}>
                    {activeSectionExpanded ? (
                      <ArrowUp2 size={18} color={COLORS.accent} variant="Bold" />
                    ) : (
                      <ArrowDown2 size={18} color={COLORS.accent} variant="Bold" />
                    )}
                    <View style={styles.finalizedSectionTitleCol}>
                      <Text style={styles.finalizedSectionTitle}>Auditorías pendientes</Text>
                    </View>
                  </View>
                  <View style={styles.pendingSectionCountBadge}>
                    <Text style={styles.pendingSectionCountText}>{pendingAudits.length}</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => navigation.navigate("InventoryAuditDetail", { auditId: item.audit.id })}
              >
                <AuditCard audit={item.audit} section={item.section} />
              </TouchableOpacity>
            );
          }}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Box size={36} color={COLORS.accent} variant="Bold" />
              </View>
              <Text style={styles.emptyTitle}>Sin auditorías</Text>
              <Text style={styles.emptySub}>
                Cuando te asignen una auditoría, aparecerá aquí con su estado.
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={COLORS.accent} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg, overflow: "hidden" },
  listPad: { paddingHorizontal: 16, flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 28 },
  finalizedSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDF1F6",
  },
  finalizedSectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  finalizedSectionTitleCol: { flex: 1, minWidth: 0 },
  finalizedSectionTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text, letterSpacing: -0.35 },
  finalizedSectionCountBadge: {
    backgroundColor: COLORS.greenSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    minWidth: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.35)",
  },
  finalizedSectionCountText: { fontSize: 14, fontWeight: "900", color: COLORS.greenDark },
  inProgressSectionCountBadge: {
    backgroundColor: "#E8F1FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    minWidth: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFD7FF",
  },
  inProgressSectionCountText: { fontSize: 14, fontWeight: "900", color: "#1D4ED8" },
  pendingSectionCountBadge: {
    backgroundColor: "#FFF4E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    minWidth: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  pendingSectionCountText: { fontSize: 14, fontWeight: "900", color: "#C45F00" },
  cardDateFooter: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E7EDF6",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F6F9FE",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  cardDateIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE7F2",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDateTextCol: { flex: 1, minWidth: 0 },
  cardDateLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.75,
    color: "#64748B",
    marginBottom: 1,
  },
  cardDateRange: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F2A44",
    letterSpacing: -0.2,
  },
  cardFinalizedFooter: {
    marginTop: 8,
    paddingTop: 8,
  },
  cardFinalizedDate: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.greenDark,
    letterSpacing: -0.15,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  errorText: { fontSize: 12, color: "#B91C1C" },
  card: {
    backgroundColor: "rgba(255,255,255,0.48)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    borderTopWidth: 2,
    borderTopColor: "#D9E2EE",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  ringsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  ringCol: { flex: 1, alignItems: "center" },
  ringLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 1.05,
    marginBottom: 8,
  },
  ringWrap: {
    width: 94,
    height: 94,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 47,
    backgroundColor: "#F8FAFD",
    borderWidth: 1,
    borderColor: "#E7EDF6",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 1,
  },
  ringCenterGlow: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  ringValue: {
    position: "absolute",
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  ringValueMuted: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  pendingTotalsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  pendingTotalCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.58)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8EEF7",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pendingTotalLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 0.7,
  },
  pendingTotalValue: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 2,
    letterSpacing: -0.6,
  },
  chipsSection: { marginBottom: 0 },
  chipsSectionLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.ink,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
    opacity: 0.62,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: "#F7FAFC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    maxWidth: "100%",
    borderWidth: 1,
    borderColor: "#E8EEF5",
  },
  chipPrimary: {
    backgroundColor: "#EEF3FA",
    borderColor: "#D6E0EF",
  },
  chipText: { fontSize: 11, fontWeight: "800", color: COLORS.ink },
  chipMore: { fontSize: 11, fontWeight: "900", color: COLORS.accentDark },
  empty: { alignItems: "center", paddingVertical: 52, paddingHorizontal: 24 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.accentGlow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(234, 118, 0, 0.3)",
  },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: COLORS.ink, marginTop: 18, letterSpacing: -0.3 },
  emptySub: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
    fontWeight: "600",
  },
  footerLoading: { paddingVertical: 20 },
  skeletonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  skeletonStats: {
    height: 56,
    borderRadius: 14,
    backgroundColor: "#D8DEE9",
  },
});
