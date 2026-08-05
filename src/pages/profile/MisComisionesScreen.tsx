import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ArrowLeft2, ArrowRight2, Coin } from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import {
  COMMISSION_KIND_LABELS,
  currentCommissionPeriodKey,
  fetchMyCommissions,
  formatCommissionPeriodLabel,
  shiftCommissionPeriodKey,
  type MyCommissionLineDto,
  type MyCommissionsDto,
} from "../../services/commissionsService";

const COLORS = {
  bg: "#F7F7F6",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  border: "#E5E7EB",
  accent: "#EA7600",
  accentSoft: "#FFF4EB",
  green: "#059669",
  greenSoft: "#ECFDF5",
  greenBorder: "#A7F3D0",
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n);
}

function formatAccruedAt(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(+d)) return "—";
  const day = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${day} · ${time}`;
}

function splitConcept(concept: string | null | undefined) {
  const raw = concept?.trim() || "";
  if (!raw) return { label: "Comisión", ref: null as string | null };
  const sep = " · ";
  const idx = raw.indexOf(sep);
  if (idx === -1) return { label: raw, ref: null as string | null };
  return {
    label: raw.slice(0, idx).trim() || "Comisión",
    ref: raw.slice(idx + sep.length).trim() || null,
  };
}

function LineCard({ line }: { line: MyCommissionLineDto }) {
  const { label, ref } = splitConcept(line.concept);
  const kindLabel = COMMISSION_KIND_LABELS[line.kind] ?? line.kind;

  return (
    <View style={styles.lineCard}>
      <View style={styles.lineTop}>
        <View style={styles.kindPill}>
          <Text style={styles.kindPillText}>{kindLabel}</Text>
        </View>
        <Text style={styles.lineAmount}>{formatMoney(line.amount)}</Text>
      </View>
      <Text style={styles.lineLabel}>{label}</Text>
      {ref ? <Text style={styles.lineRef}>{ref}</Text> : null}
      <View style={styles.lineMeta}>
        <Text style={styles.lineMetaText}>{formatAccruedAt(line.accruedAt)}</Text>
        <Text style={styles.lineMetaText}>
          Base {formatMoney(line.baseAmount)} · {line.ratePercent}%
        </Text>
      </View>
    </View>
  );
}

export default function MisComisionesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();
  const [periodKey, setPeriodKey] = useState(currentCommissionPeriodKey);
  const [data, setData] = useState<MyCommissionsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (key: string, soft = false) => {
    if (!soft) setLoading(true);
    try {
      const res = await fetchMyCommissions(key);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(periodKey);
    }, [load, periodKey]),
  );

  const kindEntries = useMemo(() => {
    const byKind = data?.totals.byKind ?? {};
    return Object.entries(byKind)
      .map(([kind, amount]) => ({
        kind,
        label: COMMISSION_KIND_LABELS[kind] ?? kind,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [data]);

  const lines = data?.lines ?? [];
  const canGoNext = periodKey < currentCommissionPeriodKey();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <HeaderTitle
        title="Mis comisiones"
        subtitle="Lo generado en el periodo"
        tone="light"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: Math.max(tabBarHeight, insets.bottom) + 24,
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={onAutoTabBarScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(periodKey, true);
            }}
            tintColor={COLORS.accent}
          />
        }
      >
        <View style={styles.periodRow}>
          <Pressable
            style={styles.periodBtn}
            onPress={() => setPeriodKey((k) => shiftCommissionPeriodKey(k, -1))}
            accessibilityRole="button"
            accessibilityLabel="Periodo anterior"
          >
            <ArrowLeft2 size={18} color={COLORS.text} />
          </Pressable>
          <Text style={styles.periodLabel}>{formatCommissionPeriodLabel(periodKey)}</Text>
          <Pressable
            style={[styles.periodBtn, !canGoNext ? styles.periodBtnDisabled : null]}
            onPress={() => {
              if (!canGoNext) return;
              setPeriodKey((k) => shiftCommissionPeriodKey(k, 1));
            }}
            disabled={!canGoNext}
            accessibilityRole="button"
            accessibilityLabel="Periodo siguiente"
          >
            <ArrowRight2 size={18} color={canGoNext ? COLORS.text : "#CBD5E1"} />
          </Pressable>
        </View>

        {loading && !data ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : (
          <>
            <View style={styles.totalCard}>
              <View style={styles.totalIconWrap}>
                <Coin size={22} color={COLORS.green} variant="Bold" />
              </View>
              <View style={styles.totalCopy}>
                <Text style={styles.totalHint}>Total del periodo</Text>
                <Text style={styles.totalAmount}>
                  {formatMoney(data?.totals.total ?? 0)}
                </Text>
              </View>
            </View>

            {kindEntries.length > 0 ? (
              <View style={styles.kindRow}>
                {kindEntries.map((entry) => (
                  <View key={entry.kind} style={styles.kindChip}>
                    <Text style={styles.kindChipLabel}>{entry.label}</Text>
                    <Text style={styles.kindChipAmount}>{formatMoney(entry.amount)}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>
              {lines.length === 1 ? "1 línea" : `${lines.length} líneas`}
            </Text>

            {lines.length === 0 ? (
              <View style={styles.empty}>
                <Coin size={40} color="#CBD5E1" variant="Bold" />
                <Text style={styles.emptyTitle}>Sin comisiones</Text>
                <Text style={styles.emptyHint}>
                  Cuando completes entregas, aquí verás lo generado en el periodo.
                </Text>
              </View>
            ) : (
              lines.map((line) => <LineCard key={line.id} line={line} />)
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  center: {
    paddingTop: 48,
    alignItems: "center",
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  periodBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  periodBtnDisabled: {
    opacity: 0.55,
  },
  periodLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  totalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    marginBottom: 12,
  },
  totalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  totalCopy: {
    flex: 1,
  },
  totalHint: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065F46",
  },
  totalAmount: {
    marginTop: 2,
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.green,
    letterSpacing: -0.4,
  },
  kindRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  kindChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: "47%",
    flexGrow: 1,
  },
  kindChipLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  kindChipAmount: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  sectionTitle: {
    marginBottom: 10,
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  lineCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  lineTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  kindPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
  },
  kindPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
  },
  lineAmount: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text,
  },
  lineLabel: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  lineRef: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
  },
  lineMeta: {
    marginTop: 10,
    gap: 2,
  },
  lineMetaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  emptyHint: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 18,
  },
});

