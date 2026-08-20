import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { HOME_COLORS } from "../homeTheme";
import type {
  WorkerRoleHomeChart,
  WorkerRoleHomePaymentSlice,
} from "../../../services/workerKpisService";
import { HomeRoleKpiComboChart } from "./HomeRoleKpiComboChart";

const PALETTE = ["#EA7600", "#16A34A", "#0EA5E9", "#B45309", "#7C3AED", "#E11D48"];
const TITLE_GREEN = "#16A34A";

function colorAt(index: number): string {
  return PALETTE[index % PALETTE.length];
}

function colorWash(index: number): string {
  const hex = colorAt(index);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.14)`;
}

function maxValue(items: { value: number }[]): number {
  return Math.max(1, ...items.map((item) => Math.max(0, item.value)));
}

function compactBarMxn(value: number) {
  const amount = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    notation: Math.abs(amount) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(amount) >= 1000 ? 1 : 0,
  }).format(amount);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0%";
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded}%`;
}

function BarsChart({ items }: { items: WorkerRoleHomeChart["items"] }) {
  const peak = maxValue(items);
  return (
    <View style={styles.stack}>
      {items.map((item, index) => {
        const pct = Math.max(6, Math.round((item.value / peak) * 100));
        return (
          <View key={item.label} style={styles.barRow}>
            <View style={styles.barMeta}>
              <Text style={styles.barLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.barValue}>{item.value}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${item.value <= 0 ? 0 : pct}%`,
                    backgroundColor: colorAt(index),
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ColumnsChart({
  items,
  money = false,
}: {
  items: WorkerRoleHomeChart["items"];
  money?: boolean;
}) {
  const peak = maxValue(items);
  const plotH = 112;

  return (
    <View style={styles.columns}>
      {items.map((item, index) => {
        const fillH =
          item.value <= 0 ? 8 : Math.max(16, Math.round((item.value / peak) * plotH));
        return (
          <View key={item.label} style={styles.column}>
            <Text
              style={[
                money ? styles.payColumnValue : styles.columnValue,
                item.value > 0 ? null : styles.columnValueMuted,
              ]}
              numberOfLines={1}
            >
              {money ? compactBarMxn(item.value) : item.value}
            </Text>
            <View style={[styles.columnTrack, { height: plotH }]}>
              <View
                style={[
                  styles.columnFill,
                  {
                    height: fillH,
                    backgroundColor: item.value > 0 ? colorAt(index) : HOME_COLORS.track,
                  },
                ]}
              />
            </View>
            <Text style={styles.columnLabel} numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function DonutChart({
  items,
  centerLabel,
}: {
  items: WorkerRoleHomeChart["items"];
  centerLabel?: string;
}) {
  const size = 108;
  const stroke = 14;
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const total = items.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  let offset = 0;

  return (
    <View style={styles.donutWrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={HOME_COLORS.track}
            strokeWidth={stroke}
            fill="none"
          />
          {total > 0
            ? items.map((item, index) => {
                const len = (Math.max(0, item.value) / total) * c;
                const dashoffset = -offset;
                offset += len;
                if (len <= 0) return null;
                return (
                  <Circle
                    key={item.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={colorAt(index)}
                    strokeWidth={stroke}
                    strokeLinecap="butt"
                    strokeDasharray={`${len} ${c - len}`}
                    strokeDashoffset={dashoffset}
                    fill="none"
                    originX={size / 2}
                    originY={size / 2}
                    rotation={-90}
                  />
                );
              })
            : null}
        </Svg>
        <View style={styles.donutCenter} pointerEvents="none">
          <Text style={styles.donutCenterText}>{centerLabel ?? String(total)}</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {items.map((item, index) => (
          <View key={item.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colorAt(index) }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.legendValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AreaChart({ items }: { items: WorkerRoleHomeChart["items"] }) {
  const [width, setWidth] = useState(0);
  const plotH = 96;
  const padX = 8;
  const padTop = 12;
  const padBottom = 8;
  const innerW = Math.max(width - padX * 2, 0);
  const innerH = plotH - padTop - padBottom;
  const peak = maxValue(items);
  const hasSales = items.some((item) => item.value > 0);
  const count = items.length;
  const pts = items.map((item, index) => {
    const x =
      padX + (count <= 1 ? innerW / 2 : (index / Math.max(count - 1, 1)) * innerW);
    const ratio = hasSales ? Math.max(0, item.value) / peak : 0;
    const y = padTop + innerH - ratio * innerH;
    return { x, y, value: item.value, label: item.label };
  });
  const baselineY = padTop + innerH;
  const lineD = pts
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(" ");
  const areaD = pts.length
    ? `${lineD} L${(padX + innerW).toFixed(1)} ${baselineY} L${padX} ${baselineY} Z`
    : "";
  const stroke = hasSales ? "#EA7600" : "rgba(60, 60, 67, 0.28)";
  const fill = hasSales ? "rgba(234, 118, 0, 0.2)" : "rgba(60, 60, 67, 0.06)";

  return (
    <View
      style={styles.areaBox}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <>
          <Svg width={width} height={plotH}>
            <Line
              x1={padX}
              y1={baselineY}
              x2={padX + innerW}
              y2={baselineY}
              stroke={HOME_COLORS.track}
              strokeWidth={1}
            />
            {areaD ? <Path d={areaD} fill={fill} /> : null}
            {lineD ? (
              <Path
                d={lineD}
                fill="none"
                stroke={stroke}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {pts.map((point, index) => (
              <Circle
                key={`${point.label}-${index}`}
                cx={point.x}
                cy={point.y}
                r={point.value > 0 ? 4.2 : 3}
                fill={point.value > 0 ? "#EA7600" : "#C4BDB6"}
              />
            ))}
          </Svg>
          <View style={styles.areaLabels}>
            {items.map((item, index) => (
              <Text key={`${item.label}-${index}`} style={styles.areaLabel}>
                {item.label}
              </Text>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const HIDDEN_PAYMENT_CODES = new Set([
  "CREDITO_TABLE_RED",
  "NOMINA",
  "PUNTOS",
]);

const PAYMENT_ORDER = [
  "EFECTIVO",
  "DEPOSITO",
  "TARJETA_DE_DEBITO",
  "TARJETA_DE_CREDITO",
  "TRANSFERENCIA",
];

function paymentRank(code: string) {
  const index = PAYMENT_ORDER.indexOf(code.trim().toUpperCase());
  return index === -1 ? PAYMENT_ORDER.length : index;
}

function PaymentColumnsChart({
  payments,
}: {
  payments: WorkerRoleHomePaymentSlice[];
}) {
  const visible = payments
    .filter((item) => !HIDDEN_PAYMENT_CODES.has(item.code.trim().toUpperCase()))
    .sort((a, b) => paymentRank(a.code) - paymentRank(b.code));
  const peak = maxValue(visible);
  const plotH = 112;

  if (visible.length === 0) {
    return (
      <Text style={styles.columnLabel}>Sin cobros en el periodo</Text>
    );
  }

  return (
    <View style={styles.payColumns}>
      {visible.map((item, index) => {
        const fillH =
          item.value <= 0
            ? 8
            : Math.max(16, Math.round((item.value / peak) * plotH));
        return (
          <View key={`${item.code}-${item.label}`} style={styles.payColumn}>
            <Text
              style={[
                styles.payColumnValue,
                item.value > 0 ? null : styles.columnValueMuted,
              ]}
              numberOfLines={1}
            >
              {compactBarMxn(item.value)}
            </Text>
            <Text
              style={[
                styles.columnPercent,
                item.value > 0 ? null : styles.columnValueMuted,
              ]}
              numberOfLines={1}
            >
              {formatPercent(item.percent)}
            </Text>
            <View style={[styles.columnTrack, { height: plotH }]}>
              <View
                style={[
                  styles.columnFill,
                  {
                    height: fillH,
                    backgroundColor:
                      item.value > 0 ? colorAt(index) : HOME_COLORS.track,
                  },
                ]}
              />
            </View>
            <Text style={styles.columnLabel} numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SegmentsChart({ items }: { items: WorkerRoleHomeChart["items"] }) {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  return (
    <View style={styles.stack}>
      <View style={styles.segmentTrack}>
        {total <= 0 ? (
          <View style={[styles.segmentPart, { flex: 1, backgroundColor: HOME_COLORS.track }]} />
        ) : (
          items.map((item, index) =>
            item.value > 0 ? (
              <View
                key={item.label}
                style={[
                  styles.segmentPart,
                  { flex: item.value, backgroundColor: colorAt(index) },
                ]}
              />
            ) : null,
          )
        )}
      </View>
      <View style={styles.segmentLegend}>
        {items.map((item, index) => (
          <View key={item.label} style={styles.segmentItem}>
            <View style={[styles.legendDot, { backgroundColor: colorAt(index) }]} />
            <Text style={styles.segmentLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.barValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function GridChart({ items }: { items: WorkerRoleHomeChart["items"] }) {
  return (
    <View style={styles.grid}>
      {items.map((item, index) => (
        <View key={item.label} style={styles.gridCell}>
          <View style={[styles.gridWash, { backgroundColor: colorWash(index) }]}>
            <Text style={[styles.gridValue, { color: colorAt(index) }]}>{item.value}</Text>
            <Text style={styles.gridLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function chartUsesMxn(chart: WorkerRoleHomeChart): boolean {
  if (chart.valueFormat === "mxn") return true;
  if (chart.valueFormat === "count") return false;
  const labels = new Set(chart.items.map((item) => item.label));
  return labels.has("Caja") && labels.has("Cobrado") && labels.has("Por cobrar");
}

export function HomeRoleKpiChart({ chart }: { chart: WorkerRoleHomeChart }) {
  if (chart.kind === "duoArea") {
    return <HomeRoleKpiComboChart chart={chart} />;
  }
  if (chart.payments?.length) {
    return <PaymentColumnsChart payments={chart.payments ?? []} />;
  }
  const money = chartUsesMxn(chart);
  if (chart.kind === "bars") return <ColumnsChart items={chart.items} money={money} />;
  if (chart.kind === "columns") {
    return <ColumnsChart items={chart.items} money={money} />;
  }
  if (chart.kind === "donut") {
    return <DonutChart items={chart.items} centerLabel={chart.centerLabel} />;
  }
  if (chart.kind === "area") return <AreaChart items={chart.items} />;
  if (chart.kind === "segments") return <SegmentsChart items={chart.items} />;
  if (chart.kind === "grid") return <GridChart items={chart.items} />;
  return <BarsChart items={chart.items} />;
}

const styles = StyleSheet.create({
  stack: {
    width: "100%",
    gap: 8,
  },
  barRow: {
    gap: 4,
  },
  barMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  barLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: HOME_COLORS.muted,
  },
  barValue: {
    fontSize: 12,
    fontWeight: "700",
    color: HOME_COLORS.ink,
    fontVariant: ["tabular-nums"],
  },
  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: HOME_COLORS.track,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
  },
  columns: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  column: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  columnTrack: {
    width: "100%",
    maxWidth: 36,
    borderRadius: 14,
    backgroundColor: "rgba(60, 60, 67, 0.08)",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  columnFill: {
    width: "100%",
    borderRadius: 14,
  },
  columnValue: {
    fontSize: 13,
    fontWeight: "800",
    color: HOME_COLORS.ink,
    fontVariant: ["tabular-nums"],
  },
  columnValueMuted: {
    color: HOME_COLORS.muted,
  },
  columnLabel: {
    minHeight: 28,
    fontSize: 11,
    fontWeight: "600",
    color: HOME_COLORS.muted,
    textAlign: "center",
  },
  columnPercent: {
    fontSize: 11,
    fontWeight: "700",
    color: HOME_COLORS.ink,
    fontVariant: ["tabular-nums"],
  },
  payColumns: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "flex-end",
    gap: 6,
  },
  payColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 4,
  },
  payColumnValue: {
    fontSize: 11,
    fontWeight: "800",
    color: HOME_COLORS.ink,
    fontVariant: ["tabular-nums"],
  },
  donutWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  donutCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenterText: {
    fontSize: 20,
    fontWeight: "800",
    color: HOME_COLORS.ink,
    fontVariant: ["tabular-nums"],
  },
  legend: {
    flex: 1,
    gap: 6,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: HOME_COLORS.muted,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: "700",
    color: HOME_COLORS.ink,
    fontVariant: ["tabular-nums"],
  },
  areaBox: {
    width: "100%",
  },
  areaLabels: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  areaLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: "600",
    color: HOME_COLORS.muted,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  segmentTrack: {
    height: 14,
    borderRadius: 999,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: HOME_COLORS.track,
  },
  segmentPart: {
    height: "100%",
  },
  segmentLegend: {
    gap: 6,
  },
  segmentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  segmentLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: HOME_COLORS.muted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridCell: {
    width: "48%",
    flexGrow: 1,
  },
  gridWash: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  gridValue: {
    fontSize: 20,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  gridLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    color: HOME_COLORS.muted,
  },
});

export const ROLE_KPI_TITLE_GREEN = TITLE_GREEN;
