import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import { ArrowRight2, Box, Building, Calendar } from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { PageFlipReveal } from "../../components/PageFlipReveal";
import { SoftPressable } from "../../components/SoftPressable";
import { headerSafeEdges } from "../../routes/headerSafeEdges";
import { SCREEN_GUTTER } from "../../theme/layout";
import {
  getMyAudits,
  auditFamilyDisplayLabel,
  type MyInventoryAudit,
  type MyInventoryAuditFamily,
} from "../../services/inventoryAuditService";
import { formatInventoryAuditCalendarDateMX } from "../../utils/auditCalendarDates";
import { AUDIT_UI, auditSoftCardStyle } from "./audit/auditUi";

const PAGE_SIZE = 10;
const FLIP_STAGGER_MS = 55;

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
    return {
      label: "Pendientes",
      color: AUDIT_UI.amber,
      soft: AUDIT_UI.amberSoft,
    };
  }
  if (tab === "in_progress") {
    return {
      label: "En curso",
      color: AUDIT_UI.accent,
      soft: AUDIT_UI.accentSoft,
    };
  }
  return {
    label: "Finalizadas",
    color: AUDIT_UI.green,
    soft: AUDIT_UI.greenSoft,
  };
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
        const count = counts[tab];
        return (
          <Pressable
            key={tab}
            style={[
              styles.tab,
              selected ? { borderColor: meta.color, borderWidth: 1.5 } : null,
            ]}
            onPress={() => onChange(tab)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text
              style={[
                styles.tabLabel,
                selected ? { color: meta.color } : null,
              ]}
            >
              {meta.label}
            </Text>
            <View
              style={[
                styles.tabCount,
                selected ? { backgroundColor: meta.color } : null,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  selected ? styles.tabCountTextActive : null,
                ]}
              >
                {count}
              </Text>
            </View>
          </Pressable>
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
  onPress,
}: {
  audit: MyInventoryAudit;
  tab: AuditTab;
  onPress: () => void;
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
    <SoftPressable onPress={onPress} scaleTo={0.99} accessibilityLabel={auditTitle(audit)}>
      <View style={styles.card}>
        <View style={[styles.iconWell, { backgroundColor: meta.soft }]}>
          <Building size={20} color={meta.color} variant="Linear" />
        </View>
        <View style={styles.cardCopy}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {auditTitle(audit)}
            </Text>
            <View style={[styles.badge, { backgroundColor: meta.soft }]}>
              <Text style={[styles.badgeText, { color: meta.color }]}>
                {meta.label}
              </Text>
            </View>
          </View>
          {primaryLocation ? (
            <Text style={styles.cardMeta} numberOfLines={1}>
              {primaryLocation}
              {familiesTotal > 1 ? ` · +${familiesTotal - 1} ubicaciones` : ""}
            </Text>
          ) : null}
          {tab === "finalized" ? (
            <Text style={[styles.cardMeta, { color: AUDIT_UI.green }]}>
              Finalizada el {finalizedDateText(audit)}
            </Text>
          ) : (
            <View style={styles.dateRow}>
              <Calendar size={13} color={AUDIT_UI.muted} variant="Linear" />
              <Text style={styles.cardMeta} numberOfLines={1}>
                {formatInventoryAuditCalendarDateMX(audit.scheduledStartDate)} →{" "}
                {formatInventoryAuditCalendarDateMX(audit.scheduledEndDate)}
              </Text>
            </View>
          )}
          <Text style={styles.cardMeta} numberOfLines={1}>
            {audit.countedProducts}/{audit.totalProducts} productos · {familiesDone}/
            {familiesTotal} ubicaciones
          </Text>
          {tab !== "pending" ? (
            <View style={styles.progressBlock}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Avance</Text>
                <Text style={styles.progressValue}>{productsPct}%</Text>
              </View>
              <ProgressBar progress={productsPct} color={meta.color} />
            </View>
          ) : null}
        </View>
        <ArrowRight2 size={16} color={AUDIT_UI.muted} variant="Linear" />
      </View>
    </SoftPressable>
  );
}

function ListSkeleton() {
  const animated = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animated, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(animated, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated]);
  const opacity = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.92],
  });

  return (
    <View style={{ paddingTop: 8, gap: 10 }}>
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
      <View style={[styles.emptyWell, { backgroundColor: meta.soft }]}>
        <Box size={28} color={meta.color} variant="Linear" />
      </View>
      <Text style={styles.emptyTitle}>
        Sin auditorías {meta.label.toLowerCase()}
      </Text>
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
  const isFocused = useIsFocused();
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
      const res = await getMyAudits({
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      });
      setItems((prev) => [...prev, ...res.data]);
      offsetRef.current += res.data.length;
      hasMoreRef.current = offsetRef.current < res.total;
    } catch {
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [loading]);

  const { inProgressAudits, pendingAudits, finalizedAudits, tabCounts } =
    useMemo(() => {
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
      <AuditTabBar
        activeTab={activeTab}
        counts={tabCounts}
        onChange={setActiveTab}
      />
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView
      style={styles.safe}
      edges={headerSafeEdges("top", "left", "right")}
    >
      <HeaderTitle
        title="Auditorías de inventario"
        subtitle="Revisa el avance y entra al detalle de cada auditoría"
        tone="light"
        style={styles.header}
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
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
          renderItem={({ item, index }) => (
            <PageFlipReveal
              delay={Math.min(700, index * FLIP_STAGGER_MS)}
              active={isFocused}
              style={styles.cardWrap}
            >
              <AuditListCard
                audit={item}
                tab={activeTab}
                onPress={() =>
                  navigation.navigate("InventoryAuditDetail", {
                    auditId: item.id,
                  })
                }
              />
            </PageFlipReveal>
          )}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={AUDIT_UI.accent}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={<EmptyTabState tab={activeTab} />}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={AUDIT_UI.accent} />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  header: { paddingHorizontal: SCREEN_GUTTER },
  listPad: { paddingHorizontal: SCREEN_GUTTER, flex: 1 },
  listContent: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingBottom: 36,
    flexGrow: 1,
  },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    marginTop: 4,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: AUDIT_UI.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AUDIT_UI.divider,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: AUDIT_UI.muted,
  },
  tabCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AUDIT_UI.field,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: AUDIT_UI.muted,
  },
  tabCountTextActive: {
    color: "#FFFFFF",
  },
  cardWrap: {
    marginBottom: 10,
  },
  card: {
    ...auditSoftCardStyle(),
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 72,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: "600",
    color: AUDIT_UI.ink,
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
  cardMeta: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "500",
    color: AUDIT_UI.muted,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  progressBlock: {
    marginTop: 10,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: AUDIT_UI.muted,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: "800",
    color: AUDIT_UI.ink,
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
  errorBanner: {
    backgroundColor: AUDIT_UI.roseSoft,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    color: AUDIT_UI.rose,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyWell: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AUDIT_UI.ink,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    fontWeight: "500",
    color: AUDIT_UI.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  footerLoading: { paddingVertical: 20 },
  skeletonCard: {
    height: 88,
    borderRadius: 16,
    backgroundColor: AUDIT_UI.field,
  },
});
