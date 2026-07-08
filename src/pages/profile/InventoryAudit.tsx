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
import { ArrowRight2, Box, Building, Calendar } from "iconsax-react-native";
import {
  getMyAudits,
  auditFamilyDisplayLabel,
  type MyInventoryAudit,
  type MyInventoryAuditFamily,
} from "../../services/inventoryAuditService";
import { formatInventoryAuditCalendarDateMX } from "../../utils/auditCalendarDates";

const COLORS = {
  bg: "#F7F7F6",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  accent: "#EA7600",
  blue: "#2563EB",
  blueSoft: "#EFF6FF",
  green: "#059669",
  greenSoft: "#ECFDF5",
  amber: "#D97706",
  amberSoft: "#FFFBEB",
};

const PAGE_SIZE = 10;

const FINALIZED_AUDIT_STATUSES = new Set<MyInventoryAudit["status"]>([
  "finalized",
  "pending_responsibility",
]);

type AuditTab = "pending" | "in_progress" | "finalized";

function isFinalizedAudit(audit: MyInventoryAudit) {
  return FINALIZED_AUDIT_STATUSES.has(audit.status);
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

function familyLocationLabel(fam: MyInventoryAuditFamily) {
  return auditFamilyDisplayLabel(fam);
}

function finalizedDateText(audit: MyInventoryAudit) {
  if (audit.workerFinishedAt) {
    return new Date(audit.workerFinishedAt).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return formatInventoryAuditCalendarDateMX(audit.scheduledEndDate);
}

function auditTitle(audit: MyInventoryAudit) {
  if (audit.warehouse?.name) return audit.warehouse.name;
  const first = audit.families?.[0];
  if (first) return familyLocationLabel(first);
  return "Auditoría de inventario";
}

function tabMeta(tab: AuditTab) {
  if (tab === "pending") {
    return { label: "Pendientes", color: COLORS.amber, soft: COLORS.amberSoft };
  }
  if (tab === "in_progress") {
    return { label: "En curso", color: COLORS.blue, soft: COLORS.blueSoft };
  }
  return { label: "Finalizadas", color: COLORS.green, soft: COLORS.greenSoft };
}

function AuditTabBar({
  activeTab,
  counts,
  onChange,
}: {
  activeTab: AuditTab;
  counts: Record<AuditTab, number>;
  onChange: (tab: AuditTab) => void;
}) {
  const tabs: AuditTab[] = ["pending", "in_progress", "finalized"];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const meta = tabMeta(tab);
        const selected = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selected && { backgroundColor: meta.soft, borderColor: meta.color }]}
            onPress={() => onChange(tab)}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabLabel, selected && { color: meta.color }]}>{meta.label}</Text>
            <View style={[styles.tabCount, selected && { backgroundColor: meta.color }]}>
              <Text style={[styles.tabCountText, selected && { color: "#FFFFFF" }]}>{counts[tab]}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const width = `${Math.max(0, Math.min(100, progress))}%` as `${number}%`;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width, backgroundColor: color }]} />
    </View>
  );
}

function AuditListCard({
  audit,
  tab,
}: {
  audit: MyInventoryAudit;
  tab: AuditTab;
}) {
  const meta = tabMeta(tab);
  const families = audit.families ?? [];
  const familiesTotal = families.length;
  const familiesDone = families.filter((f) => f.status === "completed").length;
  const productsPct =
    audit.totalProducts > 0
      ? Math.round((audit.countedProducts / audit.totalProducts) * 100)
      : 0;
  const primaryLocation = families[0] ? familyLocationLabel(families[0]) : null;

  return (
    <View style={[styles.card, { borderLeftColor: meta.color }]}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.cardIcon, { backgroundColor: meta.soft }]}>
            <Building size={18} color={meta.color} variant="Bold" />
          </View>
          <View style={styles.cardTitleCol}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {auditTitle(audit)}
            </Text>
            {primaryLocation ? (
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {primaryLocation}
                {familiesTotal > 1 ? ` · +${familiesTotal - 1} ubicaciones` : ""}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: meta.soft }]}>
          <Text style={[styles.statusPillText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      {tab === "finalized" ? (
        <Text style={styles.finalizedLine}>Finalizada el {finalizedDateText(audit)}</Text>
      ) : (
        <View style={styles.dateRow}>
          <Calendar size={14} color={COLORS.muted} variant="Linear" />
          <Text style={styles.dateText}>
            {formatInventoryAuditCalendarDateMX(audit.scheduledStartDate)} →{" "}
            {formatInventoryAuditCalendarDateMX(audit.scheduledEndDate)}
          </Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <Text style={styles.statText}>
          {audit.countedProducts}/{audit.totalProducts} productos
        </Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.statText}>
          {familiesDone}/{familiesTotal} ubicaciones
        </Text>
      </View>

      {tab !== "pending" ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Avance del recuento</Text>
            <Text style={styles.progressValue}>{productsPct}%</Text>
          </View>
          <ProgressBar progress={productsPct} color={meta.color} />
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterHint}>Ver detalle</Text>
        <ArrowRight2 size={16} color={COLORS.muted} variant="Linear" />
      </View>
    </View>
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
      {[0, 1, 2].map((i) => (
        <Animated.View key={i} style={[styles.skeletonCard, { opacity }]} />
      ))}
    </View>
  );
}

function EmptyTabState({ tab }: { tab: AuditTab }) {
  const meta = tabMeta(tab);
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIconWrap, { backgroundColor: meta.soft }]}>
        <Box size={32} color={meta.color} variant="Bold" />
      </View>
      <Text style={styles.emptyTitle}>Sin auditorías {meta.label.toLowerCase()}</Text>
      <Text style={styles.emptySub}>
        {tab === "finalized"
          ? "Las auditorías cerradas aparecerán en esta pestaña."
          : "Cuando te asignen una auditoría, la verás aquí."}
      </Text>
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
  const [activeTab, setActiveTab] = useState<AuditTab>("in_progress");
  const tabInitializedRef = useRef(false);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const reloadFirstPage = useCallback(async () => {
    const res = await getMyAudits({ limit: PAGE_SIZE, offset: 0 });
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
      tabInitializedRef.current = false;
      (async () => {
        try {
          const res = await getMyAudits({ limit: PAGE_SIZE, offset: 0 });
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
      const res = await getMyAudits({ limit: PAGE_SIZE, offset: offsetRef.current });
      setItems((prev) => [...prev, ...res.data]);
      offsetRef.current += res.data.length;
      hasMoreRef.current = offsetRef.current < res.total;
    } catch {
      // keep list
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [loading]);

  const { inProgressAudits, pendingAudits, finalizedAudits, tabCounts } = useMemo(() => {
    const inProgress: MyInventoryAudit[] = [];
    const pending: MyInventoryAudit[] = [];
    const finalized: MyInventoryAudit[] = [];
    for (const a of items) {
      if (isFinalizedAudit(a)) finalized.push(a);
      else if (a.status === "in_progress") inProgress.push(a);
      else pending.push(a);
    }
    return {
      inProgressAudits: inProgress,
      pendingAudits: pending,
      finalizedAudits: finalized,
      tabCounts: {
        pending: pending.length,
        in_progress: inProgress.length,
        finalized: finalized.length,
      } satisfies Record<AuditTab, number>,
    };
  }, [items]);

  useEffect(() => {
    if (loading || tabInitializedRef.current) return;
    tabInitializedRef.current = true;
    if (inProgressAudits.length > 0) setActiveTab("in_progress");
    else if (pendingAudits.length > 0) setActiveTab("pending");
    else setActiveTab("finalized");
  }, [loading, inProgressAudits.length, pendingAudits.length]);

  const visibleAudits = useMemo(() => {
    if (activeTab === "in_progress") return inProgressAudits;
    if (activeTab === "pending") return pendingAudits;
    return finalizedAudits;
  }, [activeTab, inProgressAudits, pendingAudits, finalizedAudits]);

  const listHeader = (
    <View>
      <AuditTabBar activeTab={activeTab} counts={tabCounts} onChange={setActiveTab} />
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
        subtitle="Revisa el avance y entra al detalle de cada auditoría"
        backgroundColor={COLORS.bg}
      />

      {loading ? (
        <View style={styles.listPad}>
          <AuditTabBar
            activeTab={activeTab}
            counts={{ pending: 0, in_progress: 0, finalized: 0 }}
            onChange={setActiveTab}
          />
          <ListSkeleton />
        </View>
      ) : (
        <FlatList
          data={visibleAudits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate("InventoryAuditDetail", { auditId: item.id })}
            >
              <AuditListCard audit={item} tab={activeTab} />
            </TouchableOpacity>
          )}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={<EmptyTabState tab={activeTab} />}
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
  safe: { flex: 1, backgroundColor: COLORS.bg },
  listPad: { paddingHorizontal: 16, flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 28 },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    marginTop: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.muted,
  },
  tabCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.muted,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleCol: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    flex: 1,
  },
  finalizedLine: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.green,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  statText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  statDot: {
    fontSize: 12,
    color: "#CBD5E1",
    fontWeight: "700",
  },
  progressBlock: {
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.text,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardFooterHint: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  errorText: { fontSize: 12, color: "#B91C1C", fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    fontWeight: "600",
  },
  footerLoading: { paddingVertical: 20 },
  skeletonCard: {
    height: 132,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    marginBottom: 12,
  },
});
