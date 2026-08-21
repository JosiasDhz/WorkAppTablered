import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import {
  ArrowLeft2,
  ArrowRight2,
  Coin,
  TrendUp,
} from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { PageFlipReveal } from "../../components/PageFlipReveal";
import { SoftPressable } from "../../components/SoftPressable";
import { headerSafeEdges } from "../../routes/headerSafeEdges";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { SCREEN_GUTTER } from "../../theme/layout";
import {
  COMMISSION_KIND_LABELS,
  currentCommissionPeriodKey,
  fetchMyCommissions,
  formatCommissionPeriodLabel,
  shiftCommissionPeriodKey,
  type CommissionGoalProgressDto,
  type MyCommissionLineDto,
  type MyCommissionsDto,
} from "../../services/commissionsService";

const COLORS = {
  surface: "#FFFFFF",
  ink: "#1C1C1E",
  muted: "#8E8E93",
  divider: "rgba(60, 60, 67, 0.12)",
  accent: "#EA7600",
  field: "#F3F1EC",
};

const ACCENT_SOFT = "rgba(234, 118, 0, 0.14)";
const DONE = "#16A34A";
const DONE_SOFT = "rgba(22, 163, 74, 0.16)";
const FLIP_STAGGER_MS = 70;
const MAX_FLIP_DELAY_MS = 700;

function clampFlipDelay(delay: number) {
  return Math.min(delay, MAX_FLIP_DELAY_MS);
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n);
}

function formatMoneyShort(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatAccruedAt(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(+d)) return "—";
  const day = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
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

function headerSubtitle(
  data: MyCommissionsDto | null,
  loading: boolean,
): string {
  if (loading && !data) return "Cargando tu periodo";
  if (!data) return "Tus comisiones del periodo";
  if (data.programActive === false) return "Pronto habrá comisiones para ti";
  if (data.goal) {
    const pct = Math.round(data.goal.progress * 100);
    if (data.goal.met) return "¡Meta del mes alcanzada!";
    return `Vas al ${pct}% de tu meta`;
  }
  const total = data.totals.total ?? 0;
  if (total > 0) return `${formatMoneyShort(total)} este periodo`;
  return "Aún no hay movimientos este mes";
}

function PeriodSwitcher({
  periodKey,
  canGoNext,
  onPrev,
  onNext,
}: {
  periodKey: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.periodRow}>
      <SoftPressable
        onPress={onPrev}
        scaleTo={0.96}
        style={styles.periodBtn}
        accessibilityLabel="Periodo anterior"
      >
        <ArrowLeft2 size={18} color={COLORS.ink} variant="Linear" />
      </SoftPressable>
      <Text style={styles.periodLabel}>
        {formatCommissionPeriodLabel(periodKey)}
      </Text>
      <SoftPressable
        onPress={onNext}
        disabled={!canGoNext}
        scaleTo={0.96}
        style={[styles.periodBtn, !canGoNext ? styles.periodBtnDisabled : null]}
        accessibilityLabel="Periodo siguiente"
      >
        <ArrowRight2
          size={18}
          color={canGoNext ? COLORS.ink : "#C7C7CC"}
          variant="Linear"
        />
      </SoftPressable>
    </View>
  );
}

function HeroTotalCard({
  total,
  tierLabel,
}: {
  total: number;
  tierLabel: string | null;
}) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroTop}>
        <View style={styles.iconWell}>
          <Coin size={20} color={COLORS.accent} variant="Bold" />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroHint}>Total del periodo</Text>
          <Text style={styles.heroAmount}>{formatMoney(total)}</Text>
        </View>
      </View>
      {tierLabel ? (
        <View style={styles.tierStrip}>
          <Text style={styles.tierStripLabel}>Tu esquema</Text>
          <Text style={styles.tierStripValue}>{tierLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

function GoalProgressCard({ goal }: { goal: CommissionGoalProgressDto }) {
  const pct = Math.round(goal.progress * 100);
  const met = goal.met;
  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <View style={[styles.iconWell, met ? styles.iconWellDone : null]}>
          <TrendUp
            size={20}
            color={met ? DONE : COLORS.accent}
            variant="Bold"
          />
        </View>
        <View style={styles.goalCopy}>
          <Text style={styles.goalTitle}>{goal.label}</Text>
          <Text style={styles.goalSubtitle}>
            {met
              ? "¡Ya llegaste a la meta!"
              : `Te faltan ${formatMoneyShort(goal.remaining)}`}
          </Text>
        </View>
        <Text style={[styles.goalPct, met ? { color: DONE } : null]}>
          {pct}%
        </Text>
      </View>
      <View style={styles.goalTrack}>
        <View
          style={[
            styles.goalFill,
            {
              width: `${Math.max(4, Math.min(100, pct))}%`,
              backgroundColor: met ? DONE : COLORS.accent,
            },
          ]}
        />
      </View>
      <View style={styles.statRow}>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{formatMoneyShort(goal.current)}</Text>
          <Text style={styles.statLabel}>Vas</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{formatMoneyShort(goal.target)}</Text>
          <Text style={styles.statLabel}>Meta</Text>
        </View>
        {goal.bonusAmount != null && goal.bonusAmount > 0 ? (
          <View style={styles.statCell}>
            <Text style={[styles.statValue, { color: DONE }]}>
              {formatMoneyShort(goal.bonusAmount)}
            </Text>
            <Text style={styles.statLabel}>Bono</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function KindBreakdown({
  entries,
}: {
  entries: Array<{ kind: string; label: string; amount: number }>;
}) {
  if (entries.length === 0) return null;
  return (
    <View style={styles.kindGrid}>
      {entries.map((entry) => (
        <View key={entry.kind} style={styles.kindChip}>
          <Text style={styles.kindChipLabel}>{entry.label}</Text>
          <Text style={styles.kindChipAmount}>{formatMoney(entry.amount)}</Text>
        </View>
      ))}
    </View>
  );
}

function LineCard({ line }: { line: MyCommissionLineDto }) {
  const { label, ref } = splitConcept(line.concept);
  const kindLabel = COMMISSION_KIND_LABELS[line.kind] ?? line.kind;
  return (
    <View style={styles.lineCard}>
      <View style={styles.iconWell}>
        <Coin size={18} color={COLORS.accent} variant="Bold" />
      </View>
      <View style={styles.lineCopy}>
        <View style={styles.lineTitleRow}>
          <Text style={styles.lineTitle} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.lineAmount}>{formatMoney(line.amount)}</Text>
        </View>
        <View style={styles.lineBadge}>
          <Text style={styles.lineBadgeText}>{kindLabel}</Text>
        </View>
        {ref ? (
          <Text style={styles.lineMeta} numberOfLines={1}>
            {ref}
          </Text>
        ) : null}
        <Text style={styles.lineMeta} numberOfLines={1}>
          {formatAccruedAt(line.accruedAt)}
          {line.ratePercent > 0 ? ` · ${line.ratePercent}%` : ""}
        </Text>
      </View>
    </View>
  );
}

function ComingSoonEmptyState() {
  return (
    <View style={styles.comingEmpty}>
      <View style={styles.comingIconWell}>
        <Coin size={28} color={COLORS.accent} variant="Linear" />
      </View>
      <Text style={styles.comingTitle}>Pronto habrá comisiones para ti</Text>
      <Text style={styles.comingHint}>
        Cuando se active el esquema para tu rol, aparecen aquí tu avance, metas
        y lo que vayas generando.
      </Text>
    </View>
  );
}

function EmptyMovements() {
  return (
    <View style={styles.empty}>
      <View style={styles.iconWell}>
        <Coin size={22} color={COLORS.muted} variant="Bold" />
      </View>
      <Text style={styles.emptyTitle}>Aún no hay movimientos</Text>
      <Text style={styles.emptyHint}>
        Cuando completes ventas o entregas, aquí verás lo que vas generando en
        el periodo.
      </Text>
    </View>
  );
}

export default function MisComisionesScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
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
  const programActive = data == null ? true : data.programActive !== false;
  const showTier =
    Boolean(data?.commissionTier) && !data?.goal && programActive;
  const tierLabel = showTier
    ? `${data!.commissionTier.name} · ${data!.commissionTier.ratePercent}%`
    : null;

  let flip = 0;
  const nextFlip = () => {
    flip += 1;
    return clampFlipDelay(FLIP_STAGGER_MS * flip);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={headerSafeEdges("top")}>
        <HeaderTitle
          title="Mis comisiones"
          subtitle={headerSubtitle(data, loading)}
          tone="light"
          style={styles.header}
          onBack={() => navigation.goBack()}
        />

        {loading && !data ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : !programActive ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: SCREEN_GUTTER,
              paddingBottom: Math.max(tabBarHeight, insets.bottom) + 36,
              paddingTop: 4,
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
            <PageFlipReveal delay={0} active={isFocused} style={styles.comingReveal}>
              <ComingSoonEmptyState />
            </PageFlipReveal>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{
              paddingHorizontal: SCREEN_GUTTER,
              paddingBottom: Math.max(tabBarHeight, insets.bottom) + 24,
              paddingTop: 4,
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
            <PageFlipReveal delay={nextFlip()} active={isFocused}>
              <PeriodSwitcher
                periodKey={periodKey}
                canGoNext={canGoNext}
                onPrev={() =>
                  setPeriodKey((k) => shiftCommissionPeriodKey(k, -1))
                }
                onNext={() => {
                  if (!canGoNext) return;
                  setPeriodKey((k) => shiftCommissionPeriodKey(k, 1));
                }}
              />
            </PageFlipReveal>

            <PageFlipReveal delay={nextFlip()} active={isFocused}>
              <HeroTotalCard
                total={data?.totals.total ?? 0}
                tierLabel={tierLabel}
              />
            </PageFlipReveal>

            {data?.goal ? (
              <PageFlipReveal delay={nextFlip()} active={isFocused}>
                <GoalProgressCard goal={data.goal} />
              </PageFlipReveal>
            ) : null}

            {kindEntries.length > 0 ? (
              <PageFlipReveal delay={nextFlip()} active={isFocused}>
                <KindBreakdown entries={kindEntries} />
              </PageFlipReveal>
            ) : null}

            <PageFlipReveal delay={nextFlip()} active={isFocused}>
              <Text style={styles.sectionTitle}>
                {lines.length === 1
                  ? "1 movimiento"
                  : `${lines.length} movimientos`}
              </Text>
            </PageFlipReveal>

            {lines.length === 0 ? (
              <PageFlipReveal delay={nextFlip()} active={isFocused}>
                <EmptyMovements />
              </PageFlipReveal>
            ) : (
              <View style={styles.list}>
                {lines.map((line, index) => (
                  <PageFlipReveal
                    key={line.id}
                    delay={clampFlipDelay(FLIP_STAGGER_MS * (flip + index + 1))}
                    active={isFocused}
                  >
                    <LineCard line={line} />
                  </PageFlipReveal>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F2F7" },
  safe: { flex: 1 },
  header: { paddingHorizontal: SCREEN_GUTTER },
  scroll: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  periodBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  periodBtnDisabled: { opacity: 0.45 },
  periodLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.ink,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWellDone: {
    backgroundColor: DONE_SOFT,
  },
  heroCopy: { flex: 1, minWidth: 0 },
  heroHint: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
  },
  heroAmount: {
    marginTop: 2,
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  tierStrip: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  tierStripLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
  },
  tierStripValue: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.ink,
  },
  goalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  goalCopy: { flex: 1, minWidth: 0 },
  goalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.ink,
  },
  goalSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
  },
  goalPct: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.accent,
  },
  goalTrack: {
    marginTop: 14,
    height: 10,
    borderRadius: 999,
    backgroundColor: COLORS.field,
    overflow: "hidden",
  },
  goalFill: {
    height: "100%",
    borderRadius: 999,
  },
  statRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.field,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.ink,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.muted,
  },
  kindGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  kindChip: {
    flexGrow: 1,
    minWidth: "46%",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  kindChipLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  kindChipAmount: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.ink,
  },
  sectionTitle: {
    marginLeft: 4,
    marginTop: 10,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.muted,
  },
  list: { gap: 10 },
  lineCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
  },
  lineCopy: { flex: 1, minWidth: 0 },
  lineTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  lineTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.ink,
  },
  lineAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.ink,
  },
  lineBadge: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: ACCENT_SOFT,
  },
  lineBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accent,
  },
  lineMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.muted,
  },
  empty: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.ink,
  },
  emptyHint: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  comingEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  comingReveal: {
    flex: 1,
  },
  comingIconWell: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  comingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.ink,
    textAlign: "center",
  },
  comingHint: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
