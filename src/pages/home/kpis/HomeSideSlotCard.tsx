import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Coin } from "iconsax-react-native";
import { SoftPressable } from "../../../components/SoftPressable";
import type {
  WorkerCommissionKpi,
  WorkerRoleHomeKpi,
} from "../../../services/workerKpisService";
import { HOME_RADIUS, useHomeColors } from "../homeTheme";

type Props = {
  loading: boolean;
  commission: WorkerCommissionKpi | null;
  roleKpi: WorkerRoleHomeKpi | null;
  onPressCommission: () => void;
  onPressRole?: () => void;
};

const DONE_COLOR = "#16A34A";
const OPEN_COLOR = "#EA7600";

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

function MiniDonut({
  done,
  open,
  centerLabel,
  trackColor,
  labelColor,
}: {
  done: number;
  open: number;
  centerLabel: string;
  trackColor: string;
  labelColor: string;
}) {
  const size = 84;
  const stroke = 12;
  const r = (size - stroke) / 2 - 1;
  const c = 2 * Math.PI * r;
  const total = Math.max(0, done) + Math.max(0, open);
  const doneLen = total > 0 ? (Math.max(0, done) / total) * c : 0;
  const openLen = total > 0 ? (Math.max(0, open) / total) * c : 0;

  return (
    <View style={styles.donutBox}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        {doneLen > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={DONE_COLOR}
            strokeWidth={stroke}
            strokeDasharray={`${doneLen} ${Math.max(0, c - doneLen)}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
            fill="none"
            originX={size / 2}
            originY={size / 2}
            rotation={-90}
          />
        ) : null}
        {openLen > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={OPEN_COLOR}
            strokeWidth={stroke}
            strokeDasharray={`${openLen} ${Math.max(0, c - openLen)}`}
            strokeDashoffset={-doneLen}
            strokeLinecap="butt"
            fill="none"
            originX={size / 2}
            originY={size / 2}
            rotation={-90}
          />
        ) : null}
      </Svg>
      <View style={styles.donutCenter} pointerEvents="none">
        <Text
          style={[styles.donutCenterText, { color: labelColor }]}
          numberOfLines={1}
        >
          {centerLabel}
        </Text>
      </View>
    </View>
  );
}

function buildRoleBalance(
  roleKpi: WorkerRoleHomeKpi,
  colors: ReturnType<typeof useHomeColors>,
): {
  title: string;
  status: string;
  caption: string;
  done: number;
  open: number;
  centerLabel: string;
  toneColor: string;
} {
  const toneColor =
    roleKpi.tone === "ok"
      ? colors.positive
      : roleKpi.tone === "pending"
        ? colors.warning
        : colors.accent;

  const payments = roleKpi.chart?.payments ?? [];
  if (payments.length > 0 || roleKpi.chart?.valueFormat === "mxn") {
    const total = Math.max(
      0,
      payments.reduce((sum, item) => sum + Math.max(0, item.value), 0),
    );
    const peak = payments.reduce(
      (max, item) => Math.max(max, Math.max(0, item.value)),
      0,
    );
    const top = [...payments].sort((a, b) => b.value - a.value)[0];
    const pct =
      total > 0 && peak > 0 ? Math.round((peak / total) * 100) : 0;
    return {
      title: roleKpi.title || "Ventas",
      status: roleKpi.percentLabel || roleKpi.status,
      caption: top && top.value > 0 ? `Top ${top.shortLabel || top.label}` : roleKpi.caption,
      done: pct,
      open: Math.max(0, 100 - pct),
      centerLabel: roleKpi.percentLabel.includes("$")
        ? roleKpi.percentLabel.replace(/\s/g, "")
        : `${pct}%`,
      toneColor,
    };
  }

  const items = roleKpi.chart?.items ?? [];
  const closedRe =
    /finaliz|complet|cerrad|listo|hecho|ok|entregad|cobrad|pagad/i;
  const skipRe = /cancel/i;

  let done = 0;
  let open = 0;
  for (const item of items) {
    const value = Math.max(0, item.value);
    if (skipRe.test(item.label)) continue;
    if (closedRe.test(item.label)) done += value;
    else open += value;
  }

  const canSplit = done > 0 || (open > 0 && done === 0 && items.length >= 2);
  const progressBased = !canSplit || (done === 0 && open > 0 && roleKpi.progress > 0);

  if (progressBased || items.length === 0) {
    const pct = Math.round(Math.max(0, Math.min(1, roleKpi.progress)) * 100);
    return {
      title: "Avance",
      status: roleKpi.percentLabel.includes("%")
        ? roleKpi.percentLabel
        : `${pct}%`,
      caption: roleKpi.caption,
      done: pct,
      open: Math.max(0, 100 - pct),
      centerLabel: `${pct}%`,
      toneColor,
    };
  }

  const total = done + open;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return {
    title: "Balance",
    status: `${pct}%`,
    caption: `${done} cerrado · ${open} activo`,
    done,
    open,
    centerLabel: `${pct}%`,
    toneColor: pct >= 70 ? colors.positive : colors.accent,
  };
}

function CommissionBody({ commission }: { commission: WorkerCommissionKpi }) {
  const homeColors = useHomeColors();
  const pct = Math.round(Math.max(0, Math.min(1, commission.progress)) * 100);
  const met = Boolean(commission.goal?.met);
  const fillColor = met ? homeColors.positive : homeColors.accent;

  return (
    <View style={styles.roleBody}>
      <View
        style={[styles.iconSlot, { backgroundColor: homeColors.accentSoft }]}
      >
        <Coin size={18} color={homeColors.accent} variant="Bold" />
      </View>
      <Text
        style={[
          styles.title,
          styles.titleAfterIcon,
          { color: homeColors.muted },
        ]}
        numberOfLines={1}
      >
        Comisiones
      </Text>
      <Text style={[styles.status, { color: fillColor }]} numberOfLines={1}>
        {commission.percentLabel}
      </Text>
      <View style={[styles.track, { backgroundColor: homeColors.track }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.max(pct, commission.goal ? 4 : pct)}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
      <Text style={[styles.footer, { color: homeColors.muted }]} numberOfLines={1}>
        {commission.goal
          ? `${formatMoney(commission.goal.current)} / ${formatMoney(commission.goal.target)}`
          : `Generado ${formatMoney(commission.earnedTotal)}`}
      </Text>
    </View>
  );
}

function RoleBalanceBody({ roleKpi }: { roleKpi: WorkerRoleHomeKpi }) {
  const homeColors = useHomeColors();
  const balance = useMemo(
    () => buildRoleBalance(roleKpi, homeColors),
    [roleKpi, homeColors],
  );

  return (
    <View style={styles.roleBody}>
      <Text style={[styles.title, { color: homeColors.muted }]} numberOfLines={1}>
        {balance.title}
      </Text>
      <View style={styles.chartWrap}>
        <MiniDonut
          done={balance.done}
          open={balance.open}
          centerLabel={balance.centerLabel}
          trackColor={homeColors.track}
          labelColor={homeColors.ink}
        />
      </View>
      <Text style={[styles.status, { color: balance.toneColor }]} numberOfLines={1}>
        {balance.status}
      </Text>
      <Text style={[styles.caption, { color: homeColors.muted }]} numberOfLines={2}>
        {balance.caption}
      </Text>
    </View>
  );
}

export function HomeSideSlotCard({
  loading,
  commission,
  roleKpi,
  onPressCommission,
  onPressRole,
}: Props) {
  const homeColors = useHomeColors();
  const showCommission = Boolean(commission?.programActive);
  const showRole = !showCommission && Boolean(roleKpi);
  const cardStyle = [styles.card, { backgroundColor: homeColors.surface }];

  if (loading) {
    return (
      <View style={cardStyle}>
        <Text style={[styles.title, { color: homeColors.muted }]}>Cargando</Text>
        <Text style={[styles.status, { color: homeColors.muted }]}>—</Text>
        <Text style={[styles.caption, { color: homeColors.muted }]}>
          Consultando tu resumen
        </Text>
      </View>
    );
  }

  if (showCommission && commission) {
    return (
      <SoftPressable
        onPress={onPressCommission}
        scaleTo={0.98}
        style={cardStyle}
        accessibilityLabel={`${commission.title}. ${commission.caption}. ${commission.percentLabel}`}
      >
        <CommissionBody commission={commission} />
      </SoftPressable>
    );
  }

  if (showRole && roleKpi) {
    return (
      <SoftPressable
        onPress={onPressRole}
        disabled={!onPressRole}
        feedback={Boolean(onPressRole)}
        scaleTo={0.98}
        style={cardStyle}
        accessibilityLabel={`Avance de ${roleKpi.title}. ${roleKpi.caption}`}
      >
        <RoleBalanceBody roleKpi={roleKpi} />
      </SoftPressable>
    );
  }

  return (
    <View style={cardStyle}>
      <Text style={[styles.title, { color: homeColors.muted }]}>Resumen</Text>
      <Text style={[styles.status, { color: homeColors.muted }]}>
        Sin métricas
      </Text>
      <Text style={[styles.caption, { color: homeColors.muted }]}>
        Cuando haya datos, aparecen aquí
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    flex: 1,
    minHeight: 148,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: HOME_RADIUS.section,
    alignItems: "center",
    justifyContent: "center",
  },
  roleBody: {
    width: "100%",
    alignItems: "center",
  },
  iconSlot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 12.5,
    fontWeight: "600",
    textAlign: "center",
  },
  titleAfterIcon: {
    marginTop: 8,
  },
  status: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  caption: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
    textAlign: "center",
  },
  track: {
    marginTop: 10,
    alignSelf: "stretch",
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  footer: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  chartWrap: {
    marginTop: 8,
    marginBottom: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  donutBox: {
    width: 84,
    height: 84,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenterText: {
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
});
