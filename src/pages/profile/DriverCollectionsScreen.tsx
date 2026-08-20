import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { headerSafeEdges } from "../../routes/headerSafeEdges";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  ArrowLeft2,
  MoneyRecive,
  TickCircle,
  Clock,
  Location,
  Receipt1,
  Wallet,
} from "iconsax-react-native";
import {
  fetchDriverCollections,
  type DriverCollectionRecord,
  type DriverCollectionsResponse,
} from "../../services/driverRoutesService";

const PAGE_SIZE = 15;

type CollectionTab = "ALL" | "POR_COBRAR" | "COBRADO" | "ENTREGADO_CAJA";

const TABS: { key: CollectionTab; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "POR_COBRAR", label: "Por cobrar" },
  { key: "COBRADO", label: "Cobrados" },
  { key: "ENTREGADO_CAJA", label: "En caja" },
];

function formatMoney(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n);
}

function formatDateShort(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const STATUS_STYLE: Record<
  DriverCollectionRecord["collectionStatus"],
  { bg: string; text: string; label: string; icon: React.ReactNode }
> = {
  POR_COBRAR: {
    bg: "#FFFBEB",
    text: "#D97706",
    label: "Por cobrar",
    icon: <Clock size={12} color="#D97706" variant="Bold" />,
  },
  COBRADO: {
    bg: "#EFF6FF",
    text: "#2563EB",
    label: "Cobrado",
    icon: <Wallet size={12} color="#2563EB" variant="Bold" />,
  },
  ENTREGADO_CAJA: {
    bg: "#ECFDF5",
    text: "#059669",
    label: "En caja",
    icon: <TickCircle size={12} color="#059669" variant="Bold" />,
  },
};

function SummaryStrip({
  summary,
}: {
  summary: DriverCollectionsResponse["summary"];
}) {
  return (
    <View style={s.summaryRow}>
      <View style={[s.summaryCard, { borderColor: "#FDE68A" }]}>
        <Text style={[s.summaryAmount, { color: "#D97706" }]}>
          {formatMoney(summary.totalPorCobrarMxn)}
        </Text>
        <Text style={s.summaryLabel}>
          Por cobrar · {summary.countPorCobrar}
        </Text>
      </View>
      <View style={[s.summaryCard, { borderColor: "#BFDBFE" }]}>
        <Text style={[s.summaryAmount, { color: "#2563EB" }]}>
          {formatMoney(summary.totalCobradoMxn)}
        </Text>
        <Text style={s.summaryLabel}>
          Cobrado · {summary.countCobrado}
        </Text>
      </View>
      <View style={[s.summaryCard, { borderColor: "#A7F3D0" }]}>
        <Text style={[s.summaryAmount, { color: "#059669" }]}>
          {formatMoney(summary.totalEntregadoCajaMxn)}
        </Text>
        <Text style={s.summaryLabel}>
          Caja · {summary.countEntregadoCaja}
        </Text>
      </View>
    </View>
  );
}

function CollectionCard({ item }: { item: DriverCollectionRecord }) {
  const cfg = STATUS_STYLE[item.collectionStatus];
  const isPending = item.collectionStatus === "POR_COBRAR";
  return (
    <View
      style={[
        s.card,
        {
          borderColor:
            item.collectionStatus === "ENTREGADO_CAJA"
              ? "#A7F3D0"
              : item.collectionStatus === "COBRADO"
                ? "#BFDBFE"
                : "#FDE68A",
        },
      ]}
    >
      <View style={s.cardHeader}>
        <View style={s.routeBadge}>
          <Receipt1 size={14} color="#64748B" variant="Bold" />
          <Text style={s.routeLabel}>{item.routeFolio}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
          {cfg.icon}
          <Text style={[s.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>

      {item.saleFolio ? (
        <Text style={s.saleFolio}>Venta {item.saleFolio}</Text>
      ) : null}

      {item.addressLine ? (
        <View style={s.addressRow}>
          <Location size={13} color="#94A3B8" variant="Bold" />
          <Text style={s.addressText} numberOfLines={1}>
            {item.addressLine}
          </Text>
        </View>
      ) : null}

      <View style={s.moneyGrid}>
        <View style={s.moneyItem}>
          <Text style={s.moneyLabel}>
            {isPending ? "Por cobrar" : "Neto"}
          </Text>
          <Text style={[s.moneyValue, { color: cfg.text }]}>
            {formatMoney(isPending ? item.pendingAmountMxn : item.netMxn)}
          </Text>
        </View>
        {!isPending ? (
          <View style={s.moneyItem}>
            <Text style={s.moneyLabel}>Recibido</Text>
            <Text style={s.moneyValue}>{formatMoney(item.receivedMxn)}</Text>
          </View>
        ) : null}
        {!isPending && item.changeMxn > 0 ? (
          <View style={s.moneyItem}>
            <Text style={s.moneyLabel}>Cambio</Text>
            <Text style={[s.moneyValue, { color: "#059669" }]}>
              {formatMoney(item.changeMxn)}
            </Text>
          </View>
        ) : null}
      </View>

      {item.recordedAtCdmx ? (
        <Text style={s.dateText}>{formatDateShort(item.recordedAtCdmx)}</Text>
      ) : null}
    </View>
  );
}

export default function DriverCollectionsScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState<DriverCollectionRecord[]>([]);
  const [summary, setSummary] = useState<DriverCollectionsResponse["summary"]>({
    totalPorCobrarMxn: 0,
    totalCobradoMxn: 0,
    totalEntregadoCajaMxn: 0,
    countPorCobrar: 0,
    countCobrado: 0,
    countEntregadoCaja: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<CollectionTab>("ALL");

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const statusParam = useMemo(() => {
    if (tab === "ALL") return undefined;
    return tab as "POR_COBRAR" | "COBRADO" | "ENTREGADO_CAJA";
  }, [tab]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    offsetRef.current = 0;
    hasMoreRef.current = true;
    try {
      const res = await fetchDriverCollections({
        limit: PAGE_SIZE,
        offset: 0,
        status: statusParam,
      });
      setItems(res.records);
      setSummary(res.summary);
      offsetRef.current = res.records.length;
      hasMoreRef.current = offsetRef.current < res.totalRecords;
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusParam]);

  useFocusEffect(
    useCallback(() => {
      void loadInitial();
    }, [loadInitial]),
  );

  const onEndReached = useCallback(async () => {
    if (!hasMoreRef.current || loading || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await fetchDriverCollections({
        limit: PAGE_SIZE,
        offset: offsetRef.current,
        status: statusParam,
      });
      setItems((prev) => [...prev, ...res.records]);
      offsetRef.current += res.records.length;
      hasMoreRef.current = offsetRef.current < res.totalRecords;
    } catch {
      /* no-op */
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, statusParam]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    offsetRef.current = 0;
    hasMoreRef.current = true;
    try {
      const res = await fetchDriverCollections({
        limit: PAGE_SIZE,
        offset: 0,
        status: statusParam,
      });
      setItems(res.records);
      setSummary(res.summary);
      offsetRef.current = res.records.length;
      hasMoreRef.current = offsetRef.current < res.totalRecords;
    } catch {
      /* no-op */
    } finally {
      setRefreshing(false);
    }
  }, [statusParam]);

  const renderItem = useCallback(
    ({ item }: { item: DriverCollectionRecord }) => (
      <CollectionCard item={item} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: DriverCollectionRecord) => item.destinationId,
    [],
  );

  const ListHeader = useMemo(
    () => (
      <SummaryStrip summary={summary} />
    ),
    [summary],
  );

  return (
    <SafeAreaView style={s.safe} edges={headerSafeEdges("top")}>
      <View style={s.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={s.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ArrowLeft2 size={22} color="#0F172A" variant="Bold" />
        </Pressable>
        <View style={s.headerIcon}>
          <MoneyRecive size={20} color="#EA7600" variant="Bold" />
        </View>
        <View style={s.headerCopy}>
          <Text style={s.headerKicker}>COBROS</Text>
          <Text style={s.headerTitle}>Mis cobros</Text>
        </View>
      </View>

      <View style={s.tabBar}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[s.tabItem, tab === t.key ? s.tabItemActive : null]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.key }}
          >
            <Text
              style={[s.tabText, tab === t.key ? s.tabTextActive : null]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#EA7600" />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={s.listContent}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.35}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#EA7600"
              colors={["#EA7600"]}
            />
          }
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <MoneyRecive size={48} color="#CBD5E1" variant="Bold" />
              <Text style={s.emptyTitle}>Sin cobros</Text>
              <Text style={s.emptySubtitle}>
                {tab === "POR_COBRAR"
                  ? "No tienes cobros pendientes en tus rutas"
                  : tab === "COBRADO"
                    ? "No tienes cobros por entregar a caja"
                    : tab === "ENTREGADO_CAJA"
                      ? "No tienes cobros entregados a caja"
                      : "Aún no tienes ventas con cobro pendiente en tus rutas"}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={s.footerLoader}>
                <ActivityIndicator size="small" color="#EA7600" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1 },
  headerKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EA7600",
    letterSpacing: 0.6,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  tabItemActive: { backgroundColor: "#EA7600" },
  tabText: { fontSize: 11, fontWeight: "700", color: "#64748B" },
  tabTextActive: { color: "#FFFFFF" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, paddingBottom: 40, gap: 10 },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  summaryAmount: { fontSize: 15, fontWeight: "900" },
  summaryLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  routeBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  routeLabel: { fontSize: 13, fontWeight: "800", color: "#334155" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: "800" },
  saleFolio: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  addressText: { flex: 1, fontSize: 12, fontWeight: "600", color: "#64748B" },
  moneyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  moneyItem: {
    minWidth: "40%",
    flex: 1,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
  },
  moneyLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  moneyValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  dateText: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "right",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#334155" },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "center",
    maxWidth: 260,
  },
  footerLoader: { paddingVertical: 16, alignItems: "center" },
});
