import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Coin } from "iconsax-react-native";
import { SoftPressable } from "../../../components/SoftPressable";
import type {
  WorkerCommissionKpi,
  WorkerRoleHomeKpi,
} from "../../../services/workerKpisService";
import { HOME_COLORS, HOME_RADIUS } from "../homeTheme";
import { HomeKpiProgressRing } from "./HomeKpiProgressRing";

type Props = {
  loading: boolean;
  commission: WorkerCommissionKpi | null;
  roleKpi: WorkerRoleHomeKpi | null;
  onPressCommission: () => void;
  onPressRole?: () => void;
};

const CHART_COLORS = ["#EA7600", "#16A34A", "#0EA5E9", "#B45309"];

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

function MiniColumns({
  items,
}: {
  items: Array<{ label: string; value: number }>;
}) {
  const peak = Math.max(1, ...items.map((item) => Math.max(0, item.value)));
  const plotH = 52;

  return (
    <View style={styles.columns}>
      {items.map((item, index) => {
        const fillH =
          item.value <= 0
            ? 6
            : Math.max(10, Math.round((item.value / peak) * plotH));
        return (
          <View key={item.label} style={styles.column}>
            <Text
              style={[
                styles.columnValue,
                item.value > 0 ? null : styles.columnValueMuted,
              ]}
              numberOfLines={1}
            >
              {item.value}
            </Text>
            <View style={[styles.columnPlot, { height: plotH }]}>
              <View
                style={[
                  styles.columnFill,
                  {
                    height: fillH,
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  },
                ]}
              />
            </View>
            <Text style={styles.columnLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function CommissionBody({ commission }: { commission: WorkerCommissionKpi }) {
  const pct = Math.round(Math.max(0, Math.min(1, commission.progress)) * 100);
  const met = Boolean(commission.goal?.met);
  const fillColor = met ? HOME_COLORS.positive : HOME_COLORS.accent;

  return (
    <>
      <View
        style={[styles.iconSlot, { backgroundColor: HOME_COLORS.accentSoft }]}
      >
        <Coin size={18} color={HOME_COLORS.accent} variant="Bold" />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        Comisiones
      </Text>
      <Text style={[styles.status, { color: fillColor }]} numberOfLines={1}>
        {commission.percentLabel}
      </Text>
      <View style={styles.track}>
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
      <Text style={styles.footer} numberOfLines={1}>
        {commission.goal
          ? `${formatMoney(commission.goal.current)} / ${formatMoney(commission.goal.target)}`
          : `Generado ${formatMoney(commission.earnedTotal)}`}
      </Text>
    </>
  );
}

function RoleBody({ roleKpi }: { roleKpi: WorkerRoleHomeKpi }) {
  const chartItems = useMemo(() => {
    const items = roleKpi.chart?.items ?? [];
    return items.slice(0, 4);
  }, [roleKpi.chart?.items]);

  return (
    <>
      <Text style={styles.title} numberOfLines={1}>
        {roleKpi.title}
      </Text>
      <Text
        style={[
          styles.status,
          {
            color:
              roleKpi.tone === "ok"
                ? HOME_COLORS.positive
                : roleKpi.tone === "pending"
                  ? HOME_COLORS.warning
                  : HOME_COLORS.accent,
          },
        ]}
        numberOfLines={1}
      >
        {roleKpi.status}
      </Text>
      {chartItems.length > 0 ? (
        <View style={styles.chartWrap}>
          <MiniColumns items={chartItems} />
        </View>
      ) : (
        <View style={styles.ringWrap}>
          <HomeKpiProgressRing
            progress={roleKpi.progress}
            label={roleKpi.percentLabel}
            tone={roleKpi.tone}
            size={72}
          />
        </View>
      )}
    </>
  );
}

export function HomeSideSlotCard({
  loading,
  commission,
  roleKpi,
  onPressCommission,
  onPressRole,
}: Props) {
  const showCommission = Boolean(commission?.programActive);
  const showRole = !showCommission && Boolean(roleKpi);

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Cargando</Text>
        <Text style={[styles.status, { color: HOME_COLORS.muted }]}>—</Text>
        <Text style={styles.caption}>Consultando tu resumen</Text>
      </View>
    );
  }

  if (showCommission && commission) {
    return (
      <SoftPressable
        onPress={onPressCommission}
        scaleTo={0.98}
        style={styles.card}
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
        style={styles.card}
        accessibilityLabel={`${roleKpi.title} ${roleKpi.status}. ${roleKpi.caption}`}
      >
        <RoleBody roleKpi={roleKpi} />
      </SoftPressable>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Resumen</Text>
      <Text style={[styles.status, { color: HOME_COLORS.muted }]}>
        Sin métricas
      </Text>
      <Text style={styles.caption}>Cuando haya datos, aparecen aquí</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 148,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: HOME_COLORS.surface,
    borderRadius: HOME_RADIUS.section,
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
    marginTop: 8,
    fontSize: 12.5,
    fontWeight: "600",
    color: HOME_COLORS.muted,
    textAlign: "center",
  },
  status: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  caption: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    color: HOME_COLORS.muted,
    textAlign: "center",
  },
  track: {
    marginTop: 10,
    alignSelf: "stretch",
    height: 6,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
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
    color: HOME_COLORS.muted,
    textAlign: "center",
  },
  chartWrap: {
    marginTop: 8,
    alignSelf: "stretch",
  },
  ringWrap: {
    marginTop: 8,
    alignItems: "center",
  },
  columns: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 4,
  },
  column: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  columnValue: {
    fontSize: 10,
    fontWeight: "800",
    color: HOME_COLORS.ink,
    fontVariant: ["tabular-nums"],
  },
  columnValueMuted: {
    color: HOME_COLORS.muted,
  },
  columnPlot: {
    marginTop: 2,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  columnFill: {
    width: "70%",
    maxWidth: 18,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  columnLabel: {
    marginTop: 4,
    fontSize: 8,
    fontWeight: "600",
    color: HOME_COLORS.muted,
    textAlign: "center",
  },
});
