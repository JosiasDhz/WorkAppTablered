import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { ArrowDown2, Calendar1, Clock } from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import {
  fetchMyAttendanceEvents,
  type MyAttendanceEventDto,
} from "../../services/attendanceService";

const COLORS = {
  bg: "#F7F7F6",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  border: "#E5E7EB",
  absentBg: "#F3E8FF",
  absentText: "#7C3AED",
  leaveBg: "#FFF4EB",
  leaveText: "#EA7600",
  lateBg: "#FEF2F2",
  lateText: "#DC2626",
  checkIn: "#16A34A",
  checkOut: "#DC2626",
  totalH: "#2563EB",
  dateBox: "#F3F4F6",
};

type DayRecord = {
  dayNum: string;
  weekday: string;
  checkIn: string;
  checkOut: string;
  total: string;
  warehouseLine: string;
  checkDetails: Array<{ label: string; time: string }>;
};

type WeekBlock = {
  id: string;
  title: string;
  rangeLabel: string;
  absent: number;
  leave: number;
  late: number;
  days: DayRecord[];
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function localYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfWeekMonday(d: Date) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = t.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  t.setDate(t.getDate() + diff);
  t.setHours(0, 0, 0, 0);
  return t;
}

function formatHm(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  return `${pad2(h)}:${pad2(m)}`;
}

function formatAmPm(hhmm: string): string {
  if (hhmm === "—") return "—";
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return hhmm;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const am = h < 12;
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${min} ${am ? "AM" : "PM"}`;
}

function diffHhMm(a: Date, b: Date): string {
  const mins = Math.floor((+b - +a) / 60000);
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${pad2(m)}m`;
}

function shortMonthEs(d: Date) {
  const raw = new Intl.DateTimeFormat("es-MX", { month: "short" }).format(d);
  return raw.replace(/\.$/, "");
}

function buildWeeksFromEvents(
  events: MyAttendanceEventDto[],
  anchorMonth: Date,
): WeekBlock[] {
  const y = anchorMonth.getFullYear();
  const m0 = anchorMonth.getMonth();
  const lastDay = new Date(y, m0 + 1, 0).getDate();
  const byDay = new Map<string, MyAttendanceEventDto[]>();
  for (const e of events) {
    const dt = new Date(e.registeredAt);
    const key = localYmd(dt);
    const arr = byDay.get(key) ?? [];
    arr.push(e);
    byDay.set(key, arr);
  }
  for (const arr of byDay.values()) {
    arr.sort((a, b) => +new Date(a.registeredAt) - +new Date(b.registeredAt));
  }

  type DayEntry = { ymd: string; date: Date; records: MyAttendanceEventDto[] };
  const dayEntries: DayEntry[] = [];
  for (let dom = 1; dom <= lastDay; dom += 1) {
    const date = new Date(y, m0, dom);
    const ymd = localYmd(date);
    const records = byDay.get(ymd);
    if (records?.length) dayEntries.push({ ymd, date, records });
  }

  const weekMap = new Map<string, DayEntry[]>();
  for (const entry of dayEntries) {
    const wk = startOfWeekMonday(entry.date);
    const wkKey = localYmd(wk);
    const list = weekMap.get(wkKey) ?? [];
    list.push(entry);
    weekMap.set(wkKey, list);
  }

  const sortedWeekKeys = [...weekMap.keys()].sort();
  let weekIdx = 0;
  const blocks: WeekBlock[] = [];
  for (const wkKey of sortedWeekKeys) {
    weekIdx += 1;
    const entries = weekMap.get(wkKey)!;
    const first = entries[0].date;
    const last = entries[entries.length - 1].date;
    const rangeLabel = `${pad2(first.getDate())}–${pad2(last.getDate())} ${shortMonthEs(first)}`;
    const days: DayRecord[] = entries.map(({ date, records }) => {
      const sorted = [...records].sort(
        (a, b) => +new Date(a.registeredAt) - +new Date(b.registeredAt),
      );
      const t0 = new Date(sorted[0].registeredAt);
      const t1 = new Date(sorted[sorted.length - 1].registeredAt);
      const names = [...new Set(sorted.map((r) => r.warehouseName).filter(Boolean))];
      const warehouseLine =
        names.length === 0
          ? ""
          : names.length === 1
            ? names[0]
            : `${names.length} sucursales`;
      const wd = new Intl.DateTimeFormat("es-MX", { weekday: "short" }).format(date);
      return {
        dayNum: pad2(date.getDate()),
        weekday: wd.charAt(0).toUpperCase() + wd.slice(1),
        checkIn: formatHm(t0),
        checkOut: sorted.length > 1 ? formatHm(t1) : "—",
        total: sorted.length > 1 ? diffHhMm(t0, t1) : "—",
        warehouseLine,
        checkDetails: sorted.map((record, index) => {
          const base = record.checkType?.name ?? `Check ${index + 1}`;
          const label = record.isExtra ? `${base} (extra)` : base;
          return {
            label,
            time: formatHm(new Date(record.registeredAt)),
          };
        }),
      };
    });
    blocks.push({
      id: wkKey,
      title: `Semana ${weekIdx}`,
      rangeLabel,
      absent: 0,
      leave: 0,
      late: 0,
      days,
    });
  }
  return blocks;
}

function formatMonthYearEs(d: Date): string {
  const raw = new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(d);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function MisRegistrosScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();

  const [anchorMonth, setAnchorMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState(anchorMonth);
  const [weeks, setWeeks] = useState<WeekBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const raw = await fetchMyAttendanceEvents(
        anchorMonth.getFullYear(),
        anchorMonth.getMonth() + 1,
      );
      setWeeks(buildWeeksFromEvents(raw, anchorMonth));
    } catch {
      setErr("No se pudieron cargar los registros.");
      setWeeks([]);
    } finally {
      setLoading(false);
    }
  }, [anchorMonth]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const subtitle = useMemo(() => "Asistencia", []);

  const openMonthPicker = useCallback(() => {
    setPickerValue(anchorMonth);
    setPickerOpen(true);
  }, [anchorMonth]);

  const confirmMonth = useCallback(() => {
    setAnchorMonth(new Date(pickerValue.getFullYear(), pickerValue.getMonth(), 1));
    setPickerOpen(false);
  }, [pickerValue]);

  const onAndroidMonthChange = useCallback(
    (event: { type: string }, date?: Date) => {
      setPickerOpen(false);
      if (event.type !== "set" || !date) return;
      setAnchorMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    },
    [],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: COLORS.bg }]} edges={["left", "right", "bottom"]}>
      <HeaderTitle
        title="Mis registros"
        subtitle={subtitle}
        tone="light"
        backgroundColor={COLORS.bg}
        style={{ paddingTop: insets.top + 8 }}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        onScroll={onAutoTabBarScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: Math.max(tabBarHeight, 120) + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={openMonthPicker}
          style={({ pressed }) => [styles.monthBar, pressed && styles.monthBarPressed]}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar mes"
        >
          <Calendar1 size={22} color={COLORS.text} variant="Linear" />
          <Text style={styles.monthBarText} numberOfLines={1}>
            {formatMonthYearEs(anchorMonth)}
          </Text>
          <ArrowDown2 size={20} color={COLORS.muted} variant="Linear" />
        </Pressable>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={COLORS.text} />
          </View>
        ) : null}

        {err ? (
          <View style={styles.errBox}>
            <Text style={styles.errText}>{err}</Text>
            <Pressable style={styles.retryBtn} onPress={() => void loadEvents()}>
              <Text style={styles.retryBtnText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !err && weeks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Calendar1 size={22} color={COLORS.muted} variant="Linear" />
            <Text style={styles.emptyText}>Sin registros de asistencia en este mes.</Text>
          </View>
        ) : null}

        {weeks.map((week) => (
          <View key={week.id} style={styles.weekSection}>
            <Pressable style={styles.weekCard} onPress={() => {}}>
              <View style={styles.weekCardLeft}>
                <Text style={styles.weekTitle}>{week.title}</Text>
                <Text style={styles.weekRange}>{week.rangeLabel}</Text>
              </View>
              <View style={styles.weekBadges}>
                <View style={[styles.badge, { backgroundColor: COLORS.absentBg }]}>
                  <Text style={[styles.badgeText, { color: COLORS.absentText }]}>{week.absent}</Text>
                  <Text style={[styles.badgeLabel, { color: COLORS.absentText }]}>Falta</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: COLORS.leaveBg }]}>
                  <Text style={[styles.badgeText, { color: COLORS.leaveText }]}>{week.leave}</Text>
                  <Text style={[styles.badgeLabel, { color: COLORS.leaveText }]}>Permiso</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: COLORS.lateBg }]}>
                  <Text style={[styles.badgeText, { color: COLORS.lateText }]}>{week.late}</Text>
                  <Text style={[styles.badgeLabel, { color: COLORS.lateText }]}>Tar.</Text>
                </View>
              </View>
              <ArrowDown2 size={18} color={COLORS.muted} variant="Linear" />
            </Pressable>

            <View style={styles.dayList}>
              {week.days.map((d, idx) => (
                <View key={`${week.id}-${d.dayNum}-${idx}`} style={styles.dayRow}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateNum}>{d.dayNum}</Text>
                    <Text style={styles.dateWd}>{d.weekday}</Text>
                  </View>
                  <View style={styles.dayMain}>
                    <View style={styles.dayCols}>
                      <View style={[styles.timeCol, styles.timeColBorder]}>
                        <Clock size={18} color={COLORS.checkIn} variant="Linear" />
                        <Text style={styles.timeValue}>{formatAmPm(d.checkIn)}</Text>
                        <Text style={styles.timeCaption}>Entrada</Text>
                      </View>
                      <View style={[styles.timeCol, styles.timeColBorder]}>
                        <Clock size={18} color={COLORS.checkOut} variant="Linear" />
                        <Text style={styles.timeValue}>{formatAmPm(d.checkOut)}</Text>
                        <Text style={styles.timeCaption}>Salida</Text>
                      </View>
                      <View style={styles.timeCol}>
                        <Clock size={18} color={COLORS.totalH} variant="Linear" />
                        <Text style={styles.timeValue}>{d.total}</Text>
                        <Text style={styles.timeCaption}>Horas</Text>
                      </View>
                    </View>
                    {d.warehouseLine ? (
                      <Text style={styles.warehouseLine} numberOfLines={2}>
                        {d.warehouseLine}
                      </Text>
                    ) : null}
                    {d.checkDetails.length > 0 ? (
                      <View style={styles.checkDetailsWrap}>
                        {d.checkDetails.map((check, checkIdx) => (
                          <View
                            key={`${week.id}-${d.dayNum}-check-${checkIdx}`}
                            style={styles.checkDetailRow}
                          >
                            <Text style={styles.checkDetailLabel} numberOfLines={1}>
                              {check.label}
                            </Text>
                            <Text style={styles.checkDetailTime}>{formatAmPm(check.time)}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {Platform.OS === "android" && pickerOpen ? (
        <DateTimePicker
          value={anchorMonth}
          mode="date"
          display="default"
          locale="es-MX"
          onChange={onAndroidMonthChange}
        />
      ) : null}

      <Modal
        visible={pickerOpen && Platform.OS === "ios"}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.pickerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPickerOpen(false)} />
          <View style={[styles.pickerCard, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <Text style={styles.pickerTitle}>Mes y año</Text>
            <DateTimePicker
              value={pickerValue}
              mode="date"
              display="spinner"
              locale="es-MX"
              onChange={(_, d) => {
                if (d) setPickerValue(new Date(d.getFullYear(), d.getMonth(), 1));
              }}
              themeVariant="light"
            />
            <Pressable style={styles.pickerConfirm} onPress={confirmMonth}>
              <Text style={styles.pickerConfirmText}>Listo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  monthBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAF9",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 12,
  },
  monthBarPressed: { opacity: 0.92 },
  monthBarText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: "center",
  },
  errBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 16,
  },
  errText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#991B1B",
    marginBottom: 10,
  },
  retryBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#0F172A",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  retryBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  emptyText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.muted,
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  pickerCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  pickerConfirm: {
    marginTop: 12,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  pickerConfirmText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  weekSection: { marginBottom: 20 },
  weekCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  weekCardLeft: { flex: 1, minWidth: 0 },
  weekTitle: { fontSize: 17, fontWeight: "900", color: COLORS.text },
  weekRange: { marginTop: 2, fontSize: 13, fontWeight: "600", color: COLORS.muted },
  weekBadges: { flexDirection: "row", alignItems: "center", gap: 8, marginRight: 8 },
  badge: {
    minWidth: 36,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  badgeText: { fontSize: 14, fontWeight: "900" },
  badgeLabel: { fontSize: 9, fontWeight: "700", marginTop: 1 },
  dayList: { gap: 8 },
  dayRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  dateBox: {
    width: 54,
    backgroundColor: COLORS.dateBox,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  dateNum: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  dateWd: { marginTop: 2, fontSize: 11, fontWeight: "700", color: COLORS.muted },
  dayMain: { flex: 1, minWidth: 0 },
  dayCols: { flexDirection: "row" },
  timeCol: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  timeColBorder: {
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  timeValue: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  timeCaption: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.muted,
    textAlign: "center",
  },
  warehouseLine: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.muted,
  },
  checkDetailsWrap: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 6,
  },
  checkDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },
  checkDetailLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
  },
  checkDetailTime: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.muted,
  },
});
