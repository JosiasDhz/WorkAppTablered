import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import type { WorkerRoleHomeChart } from "../../../services/workerKpisService";
import { useHomeColors } from "../homeTheme";

const VIEW_W = 1000;
const VIEW_H = 220;
const PAD_X = 4;
const PAD_TOP = 6;
const PAD_BOTTOM = 4;
const PLOT_W = VIEW_W - PAD_X * 2;
const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM;
const PLOT_HEIGHT_PX = 168;

function formatAxisMxn(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: amount >= 100 ? 0 : 2,
  }).format(amount);
}

function formatShare(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0%";
  return `${value.toFixed(1)}%`;
}

function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const { x, y } = points[0];
    return `M ${x - 18} ${y} L ${x + 18} ${y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const cx = (current.x + next.x) / 2;
    d += ` C ${cx} ${current.y}, ${cx} ${next.y}, ${next.x} ${next.y}`;
  }
  return d;
}

export function HomeRoleKpiComboChart({
  chart,
}: {
  chart: WorkerRoleHomeChart;
}) {
  const homeColors = useHomeColors();
  const [width, setWidth] = useState(0);
  const labels = chart.items;
  const lines = chart.lines ?? [];
  const payments = chart.payments ?? [];

  const plot = useMemo(() => {
    const values = lines.flatMap((line) =>
      line.items.map((item) => Math.max(0, item.value)),
    );
    const dataMax = Math.max(...values, 1);
    const positive = values.filter((value) => value > 0);
    const dataMin = positive.length > 0 ? Math.min(...positive) : 0;
    const span = Math.max(dataMax - dataMin, dataMax * 0.12, 1);
    const minValue = Math.max(0, dataMin - span * 0.08);
    const maxValue = dataMax + span * 0.04;
    const range = Math.max(maxValue - minValue, 1);
    const count = Math.max(labels.length, 1);
    const xAt = (index: number) =>
      PAD_X + (count <= 1 ? 0.5 : index / Math.max(count - 1, 1)) * PLOT_W;
    const yAt = (value: number) => {
      const t = Math.max(0, Math.min(1, (value - minValue) / range));
      return PAD_TOP + (1 - t) * PLOT_H;
    };
    const series = lines.map((line) => {
      const points = labels.map((item, index) => {
        const amount = line.items[index]?.value ?? 0;
        return { x: xAt(index), y: yAt(amount), amount };
      });
      return {
        ...line,
        points,
        path: buildSmoothPath(points),
      };
    });
    const yTicks = [1, 0.5, 0].map((ratio) => ({
      ratio,
      y: PAD_TOP + (1 - ratio) * PLOT_H,
      label: formatAxisMxn(minValue + range * ratio),
    }));
    return { series, yTicks, xAt };
  }, [labels, lines]);

  const hasSeries = plot.series.some((line) =>
    line.points.some((point) => point.amount > 0),
  );
  const mixTotal = payments.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  const hasChart = hasSeries || mixTotal > 0;

  if (!hasChart) {
    return (
      <Text style={[styles.empty, { color: homeColors.muted }]}>
        Sin cobranza en el periodo
      </Text>
    );
  }

  const first = plot.series[0];
  const areaD = first
    ? `${first.path} L ${first.points.at(-1)?.x ?? 0} ${PAD_TOP + PLOT_H} L ${first.points[0]?.x ?? 0} ${PAD_TOP + PLOT_H} Z`
    : "";

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => {
        const next = Math.round(e.nativeEvent.layout.width);
        setWidth((prev) => (prev === next ? prev : next));
      }}
    >
      <View style={styles.plotRow}>
        <View style={styles.yAxis}>
          <Text style={[styles.yUnit, { color: homeColors.muted }]}>MXN</Text>
          {plot.yTicks.map((tick, index, ticks) => {
            const isFirst = index === 0;
            const isLast = index === ticks.length - 1;
            return (
              <Text
                key={tick.ratio}
                style={[
                  styles.yTick,
                  {
                    color: homeColors.muted,
                    top: `${(tick.y / VIEW_H) * 100}%`,
                    transform: [
                      {
                        translateY: isFirst ? 0 : isLast ? -10 : -5,
                      },
                    ],
                  },
                ]}
              >
                {tick.label}
              </Text>
            );
          })}
        </View>
        <View style={styles.svgHost}>
          {width > 0 ? (
            <Svg
              width={Math.max(width - 52, 0)}
              height={PLOT_HEIGHT_PX}
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              preserveAspectRatio="none"
            >
              <Defs>
                {first ? (
                  <LinearGradient
                    id="homeCashierMix"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <Stop
                      offset="0%"
                      stopColor={first.color}
                      stopOpacity={0.28}
                    />
                    <Stop
                      offset="100%"
                      stopColor={first.color}
                      stopOpacity={0.02}
                    />
                  </LinearGradient>
                ) : null}
              </Defs>
              {plot.yTicks.map((tick) => (
                <Line
                  key={tick.ratio}
                  x1={PAD_X}
                  x2={VIEW_W - PAD_X}
                  y1={tick.y}
                  y2={tick.y}
                  stroke={homeColors.track}
                  strokeWidth={1.2}
                  strokeDasharray="10 8"
                />
              ))}
              {areaD ? <Path d={areaD} fill="url(#homeCashierMix)" /> : null}
              {plot.series.map((line) => (
                <Path
                  key={`${line.label}-stroke`}
                  d={line.path}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={4.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {plot.series.map((line) =>
                line.points
                  .filter((point) => point.amount > 0)
                  .map((point, index) => (
                    <Circle
                      key={`${line.label}-dot-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r={5}
                      fill={line.color}
                      stroke={homeColors.surface}
                      strokeWidth={1.4}
                    />
                  )),
              )}
            </Svg>
          ) : null}
        </View>
      </View>
      <View style={styles.xAxis}>
        {labels.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === labels.length - 1;
          return (
            <Text
              key={`${item.label}-${index}`}
              style={[
                styles.xTick,
                { color: homeColors.muted },
                isFirst ? styles.xTickFirst : null,
                isLast ? styles.xTickLast : null,
              ]}
            >
              {item.label}
            </Text>
          );
        })}
      </View>
      {mixTotal > 0 ? (
        <View style={[styles.mixTrack, { backgroundColor: homeColors.track }]}>
          {payments.map((item, index) => {
            const share = item.percent;
            if (share <= 0) return null;
            const color = lines[index]?.color ?? homeColors.accent;
            return (
              <View
                key={item.code}
                style={[styles.mixSeg, { flexGrow: share, flexBasis: 0 }]}
              >
                <View style={[styles.mixFill, { backgroundColor: color }]}>
                  {share >= 7 ? (
                    <Text style={styles.mixPct} numberOfLines={1}>
                      {formatShare(share)}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
      <View style={styles.legend}>
        {lines.map((line) => (
          <View
            key={line.label}
            style={[
              styles.legendChip,
              {
                backgroundColor: homeColors.accentSoft,
                borderColor: homeColors.track,
              },
            ]}
          >
            <View style={[styles.legendDot, { backgroundColor: line.color }]} />
            <Text
              style={[styles.legendLabel, { color: homeColors.ink }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {line.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    gap: 6,
    paddingTop: 14,
  },
  empty: {
    paddingVertical: 18,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },
  plotRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 4,
  },
  yAxis: {
    width: 48,
    height: PLOT_HEIGHT_PX,
    position: "relative",
  },
  yUnit: {
    position: "absolute",
    top: -12,
    right: 0,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  yTick: {
    position: "absolute",
    right: 0,
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  svgHost: {
    flex: 1,
    minWidth: 0,
    height: PLOT_HEIGHT_PX,
  },
  xAxis: {
    marginLeft: 52,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  xTick: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  xTickFirst: {
    textAlign: "left",
  },
  xTickLast: {
    textAlign: "right",
  },
  mixTrack: {
    height: 23,
    borderRadius: 999,
    overflow: "hidden",
    flexDirection: "row",
  },
  mixSeg: {
    minWidth: 0,
    height: "100%",
  },
  mixFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mixPct: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
  },
  legend: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    gap: 4,
  },
  legendChip: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 26,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  legendLabel: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: "700",
  },
});
