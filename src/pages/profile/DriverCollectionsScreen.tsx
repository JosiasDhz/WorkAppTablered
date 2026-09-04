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
import { useDriverUi, type DriverUi } from "./driverRoute/driverUi";

type Styles = ReturnType<typeof createStyles>;

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

type StatusStyle = {
  bg: string;
  border: string;
  text: string;
  label: string;
  icon: React.ReactNode;
};

function statusStyles(
  ui: DriverUi,
): Record<DriverCollectionRecord["collectionStatus"], StatusStyle> {
  return {
    POR_COBRAR: {
      bg: ui.amberSoft,
      border: ui.amberBorder,
      text: ui.amber,
      label: "Por cobrar",
      icon: <Clock size={12} color={ui.amber} variant="Bold" />,
    },
    COBRADO: {
      bg: ui.blueSoft,
      border: ui.blueBorder,
      text: ui.blue,
      label: "Cobrado",
      icon: <Wallet size={12} color={ui.blue} variant="Bold" />,
    },
    ENTREGADO_CAJA: {
      bg: ui.greenSoft,
      border: ui.greenBorder,
      text: ui.green,
      label: "En caja",
      icon: <TickCircle size={12} color={ui.green} variant="Bold" />,
    },
  };
}

function SummaryStrip({
  summary,
  ui,
  s,
}: {
  summary: DriverCollectionsResponse["summary"];
  ui: DriverUi;
  s: Styles;
}) {
  return (
    <View style={s.summaryRow}>
      <View style={[s.summaryCard, { borderColor: ui.amberBorder }]}>
        <Text style={[s.summaryAmount, { color: ui.amber }]}>
          {formatMoney(summary.totalPorCobrarMxn)}
        </Text>
        <Text style={s.summaryLabel}>
          Por cobrar · {summary.countPorCobrar}
        </Text>
      </View>
      <View style={[s.summaryCard, { borderColor: ui.blueBorder }]}>
        <Text style={[s.summaryAmount, { color: ui.blue }]}>
          {formatMoney(summary.totalCobradoMxn)}
        </Text>
        <Text style={s.summaryLabel}>
          Cobrado · {summary.countCobrado}
        </Text>
      </View>
      <View style={[s.summaryCard, { borderColor: ui.greenBorder }]}>
        <Text style={[s.summaryAmount, { color: ui.green }]}>
          {formatMoney(summary.totalEntregadoCajaMxn)}
        </Text>
        <Text style={s.summaryLabel}>
          Caja · {summary.countEntregadoCaja}
        </Text>
      </View>
    </View>
  );
}

function CollectionCard({
  item,
  ui,
  s,
}: {
  item: DriverCollectionRecord;
  ui: DriverUi;
  s: Styles;
}) {
  const cfg = statusStyles(ui)[item.collectionStatus];
  const isPending = item.collectionStatus === "POR_COBRAR";
  return (
    <View style={[s.card, { borderColor: cfg.border }]}>
      <View style={s.cardHeader}>
        <View style={s.routeBadge}>
          <Receipt1 size={14} color={ui.muted} variant="Bold" />
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
          <Location size={13} color={ui.faint} variant="Bold" />
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
            <Text style={[s.moneyValue, { color: ui.green }]}>
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
  const ui = useDriverUi();
  const s = useMemo(() => createStyles(ui), [ui]);
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
      <CollectionCard item={item} ui={ui} s={s} />
    ),
    [s, ui],
  );

  const keyExtractor = useCallback(
    (item: DriverCollectionRecord) => item.destinationId,
    [],
  );

  const ListHeader = useMemo(
    () => (
      <SummaryStrip summary={summary} ui={ui} s={s} />
    ),
    [s, summary, ui],
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
          <ArrowLeft2 size={22} color={ui.ink} variant="Bold" />
        </Pressable>
        <View style={s.headerIcon}>
          <MoneyRecive size={20} color={ui.accent} variant="Bold" />
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
          <ActivityIndicator size="large" color={ui.accent} />
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
              tintColor={ui.accent}
              colors={[ui.accent]}
            />
          }
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <MoneyRecive size={48} color={ui.faint} variant="Bold" />
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
                <ActivityIndicator size="small" color={ui.accent} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(ui: DriverUi) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: ui.layout },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: ui.surface,
      borderBottomWidth: 1,
      borderBottomColor: ui.border,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: ui.field,
      alignItems: "center",
      justifyContent: "center",
    },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: ui.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    headerCopy: { flex: 1 },
    headerKicker: {
      fontSize: 10,
      fontWeight: "800",
      color: ui.accent,
      letterSpacing: 0.6,
    },
    headerTitle: { fontSize: 17, fontWeight: "800", color: ui.ink },
    tabBar: {
      flexDirection: "row",
      backgroundColor: ui.surface,
      paddingHorizontal: 16,
      paddingBottom: 8,
      gap: 6,
    },
    tabItem: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: ui.field,
      alignItems: "center",
    },
    tabItemActive: { backgroundColor: ui.accent },
    tabText: { fontSize: 11, fontWeight: "700", color: ui.muted },
    tabTextActive: { color: "#FFFFFF" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    listContent: { padding: 16, paddingBottom: 40, gap: 10 },
    summaryRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
    summaryCard: {
      flex: 1,
      backgroundColor: ui.surface,
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
    },
    summaryAmount: { fontSize: 15, fontWeight: "900" },
    summaryLabel: {
      marginTop: 2,
      fontSize: 10,
      fontWeight: "700",
      color: ui.muted,
    },
    card: {
      backgroundColor: ui.surface,
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
    routeLabel: { fontSize: 13, fontWeight: "800", color: ui.ink },
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
      color: ui.muted,
      marginBottom: 6,
    },
    addressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 10,
    },
    addressText: { flex: 1, fontSize: 12, fontWeight: "600", color: ui.muted },
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
      backgroundColor: ui.surfaceAlt,
    },
    moneyLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: ui.faint,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    moneyValue: {
      marginTop: 2,
      fontSize: 16,
      fontWeight: "800",
      color: ui.ink,
    },
    dateText: {
      marginTop: 8,
      fontSize: 11,
      fontWeight: "600",
      color: ui.faint,
      textAlign: "right",
    },
    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      gap: 8,
    },
    emptyTitle: { fontSize: 16, fontWeight: "800", color: ui.ink },
    emptySubtitle: {
      fontSize: 13,
      fontWeight: "600",
      color: ui.faint,
      textAlign: "center",
      maxWidth: 260,
    },
    footerLoader: { paddingVertical: 16, alignItems: "center" },
  });
}
