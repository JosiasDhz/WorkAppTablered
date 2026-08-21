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
  Add,
  ArrowRight2,
  Calendar1,
  CalendarTick,
} from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { PageFlipReveal } from "../../components/PageFlipReveal";
import { SoftPressable } from "../../components/SoftPressable";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { SCREEN_GUTTER } from "../../theme/layout";
import {
  getMyVacationBalance,
  listMyVacationRequests,
  permissionStatusLabel,
  type VacationBalanceDto,
  type VacationRequestDto,
} from "../../services/workforceVacationsService";
import { formatWorkforceYmd } from "../../utils/formatWorkforceYmd";

const COLORS = {
  surface: "#FFFFFF",
  ink: "#1C1C1E",
  muted: "#8E8E93",
  divider: "rgba(60, 60, 67, 0.12)",
  accent: "#EA7600",
};

const ACCENT_SOFT = "rgba(234, 118, 0, 0.14)";
const DONE = "#16A34A";
const DONE_SOFT = "rgba(22, 163, 74, 0.16)";
const ROSE = "#BE123C";
const ROSE_SOFT = "#FFF1F2";
const FLIP_STAGGER_MS = 70;
const MAX_FLIP_DELAY_MS = 700;
const PENDING_STATUSES = new Set([
  "PENDING",
  "PENDING_RH",
  "PENDING_SUPERVISOR",
]);

function clampFlipDelay(delay: number) {
  return Math.min(delay, MAX_FLIP_DELAY_MS);
}

function statusTone(status: VacationRequestDto["status"]) {
  if (status === "APPROVED") return { bg: DONE_SOFT, text: DONE };
  if (status === "REJECTED") return { bg: ROSE_SOFT, text: ROSE };
  return { bg: ACCENT_SOFT, text: COLORS.accent };
}

function VacacionCard({
  item,
  onPress,
}: {
  item: VacationRequestDto;
  onPress: () => void;
}) {
  const tone = statusTone(item.status);
  const days = Math.max(1, item.requestedDays ?? 1);
  return (
    <SoftPressable
      onPress={onPress}
      scaleTo={0.99}
      accessibilityLabel={`Vacaciones. ${permissionStatusLabel(item.status)}`}
    >
      <View style={styles.card}>
        <View style={styles.iconWell}>
          <CalendarTick size={20} color={COLORS.accent} variant="Linear" />
        </View>
        <View style={styles.cardCopy}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {days === 1 ? "1 día" : `${days} días`}
            </Text>
            <View style={[styles.badge, { backgroundColor: tone.bg }]}>
              <Text style={[styles.badgeText, { color: tone.text }]}>
                {permissionStatusLabel(item.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.cardMeta} numberOfLines={1}>
            Inicio {formatWorkforceYmd(item.permissionDate)}
            {item.isVacationPayout ? " · Pago" : ""}
            {item.countsAsVacation ? " · A cuenta" : ""}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <ArrowRight2 size={16} color={COLORS.muted} variant="Linear" />
      </View>
    </SoftPressable>
  );
}

function BalanceCard({ balance }: { balance: VacationBalanceDto | null }) {
  if (!balance) return null;
  return (
    <View style={styles.balanceCard}>
      <View style={styles.balanceHeader}>
        <Calendar1 size={18} color={COLORS.accent} variant="Linear" />
        <Text style={styles.balanceTitle}>Tu saldo {new Date().getFullYear()}</Text>
      </View>
      {!balance.hireDate ? (
        <Text style={styles.balanceHint}>
          Falta tu fecha de ingreso. Pide a RH que la registre en tu expediente.
        </Text>
      ) : !balance.eligible ? (
        <Text style={styles.balanceHint}>
          Requieres al menos {balance.minServiceYears} año(s) de servicio
          (llevas {balance.serviceYears}).
        </Text>
      ) : (
        <React.Fragment>
          <View style={styles.balanceRow}>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceValue}>{balance.daysRemaining}</Text>
              <Text style={styles.balanceLabel}>Restantes</Text>
            </View>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceValue}>{balance.annualDays}</Text>
              <Text style={styles.balanceLabel}>Anuales</Text>
            </View>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceValue}>{balance.daysUsed}</Text>
              <Text style={styles.balanceLabel}>Usados</Text>
            </View>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceValue}>{balance.daysPending}</Text>
              <Text style={styles.balanceLabel}>Pendientes</Text>
            </View>
          </View>
          {balance.periodHint ? (
            <Text style={styles.balanceHint}>
              Periodo: {balance.periodHint}
              {balance.noticeDays > 0
                ? ` · aviso ${balance.noticeDays} días`
                : ""}
            </Text>
          ) : null}
        </React.Fragment>
      )}
    </View>
  );
}

export default function MisVacacionesScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();
  const [items, setItems] = useState<VacationRequestDto[]>([]);
  const [balance, setBalance] = useState<VacationBalanceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const now = new Date();
      const [list, bal] = await Promise.all([
        listMyVacationRequests({
          year: now.getFullYear(),
        }),
        getMyVacationBalance(),
      ]);
      setItems(list);
      setBalance(bal);
    } catch {
      setItems([]);
      setBalance(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const pendingItems = useMemo(
    () => items.filter((item) => PENDING_STATUSES.has(item.status)),
    [items],
  );
  const resolvedItems = useMemo(
    () => items.filter((item) => !PENDING_STATUSES.has(item.status)),
    [items],
  );

  const subtitle = loading
    ? "Cargando tus vacaciones"
    : balance?.eligible
      ? `${balance.daysRemaining} día(s) disponibles`
      : "Consulta saldo y solicitudes";

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <HeaderTitle
          title="Mis vacaciones"
          subtitle={subtitle}
          tone="light"
          style={styles.header}
          onBack={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          rightAccessory={
            <SoftPressable
              onPress={() => navigation.navigate("NuevaVacacion")}
              scaleTo={0.94}
              style={styles.addBtn}
              accessibilityLabel="Solicitar vacaciones"
            >
              <Add size={20} color={COLORS.accent} variant="Linear" />
            </SoftPressable>
          }
        />
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            onScroll={onAutoTabBarScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: SCREEN_GUTTER,
              paddingTop: 8,
              paddingBottom: Math.max(tabBarHeight, insets.bottom) + 36,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  void load();
                }}
                tintColor={COLORS.ink}
              />
            }
          >
            <PageFlipReveal delay={0} active={isFocused}>
              <BalanceCard balance={balance} />
            </PageFlipReveal>

            {items.length === 0 ? (
              <PageFlipReveal delay={FLIP_STAGGER_MS} active={isFocused}>
                <View style={styles.empty}>
                  <View style={styles.emptyWell}>
                    <CalendarTick size={28} color={COLORS.accent} variant="Linear" />
                  </View>
                  <Text style={styles.emptyTitle}>Sin solicitudes</Text>
                  <Text style={styles.emptyText}>
                    Aquí verás tus vacaciones pedidas, autorizadas o pagadas.
                  </Text>
                </View>
              </PageFlipReveal>
            ) : (
              <React.Fragment>
                {pendingItems.length > 0 ? (
                  <View style={styles.sectionBlock}>
                    <PageFlipReveal delay={FLIP_STAGGER_MS} active={isFocused}>
                      <Text style={styles.sectionTitle}>En revisión</Text>
                    </PageFlipReveal>
                    <View style={styles.list}>
                      {pendingItems.map((item, index) => (
                        <PageFlipReveal
                          key={item.id}
                          delay={clampFlipDelay(
                            FLIP_STAGGER_MS * (index + 2),
                          )}
                          active={isFocused}
                        >
                          <VacacionCard
                            item={item}
                            onPress={() =>
                              navigation.navigate("VacacionDetalle", {
                                requestId: item.id,
                              })
                            }
                          />
                        </PageFlipReveal>
                      ))}
                    </View>
                  </View>
                ) : null}
                {resolvedItems.length > 0 ? (
                  <View
                    style={
                      pendingItems.length > 0
                        ? styles.sectionBlockFollow
                        : styles.sectionBlock
                    }
                  >
                    <PageFlipReveal
                      delay={clampFlipDelay(
                        FLIP_STAGGER_MS * (pendingItems.length + 2),
                      )}
                      active={isFocused}
                    >
                      <Text style={styles.sectionTitle}>Historial</Text>
                    </PageFlipReveal>
                    <View style={styles.list}>
                      {resolvedItems.map((item, index) => (
                        <PageFlipReveal
                          key={item.id}
                          delay={clampFlipDelay(
                            FLIP_STAGGER_MS *
                              (pendingItems.length + index + 3),
                          )}
                          active={isFocused}
                        >
                          <VacacionCard
                            item={item}
                            onPress={() =>
                              navigation.navigate("VacacionDetalle", {
                                requestId: item.id,
                              })
                            }
                          />
                        </PageFlipReveal>
                      ))}
                    </View>
                  </View>
                ) : null}
              </React.Fragment>
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  balanceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 8,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.ink,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  balanceStat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F3F1EC",
    borderRadius: 12,
    paddingVertical: 10,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.ink,
  },
  balanceLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.muted,
  },
  balanceHint: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
    lineHeight: 18,
  },
  sectionBlock: { width: "100%", marginTop: 16 },
  sectionBlockFollow: { width: "100%", marginTop: 22 },
  sectionTitle: {
    marginLeft: 4,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
  },
  list: { gap: 12 },
  card: {
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWell: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: { flex: 1, minWidth: 0 },
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
    color: COLORS.ink,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cardMeta: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
  },
  cardDesc: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: COLORS.muted,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 40,
    gap: 8,
  },
  emptyWell: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.ink,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
