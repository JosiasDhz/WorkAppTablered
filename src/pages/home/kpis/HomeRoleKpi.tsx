import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SoftPressable } from "../../../components/SoftPressable";
import { HOME_RADIUS, useHomeColors } from "../homeTheme";
import type { WorkerRoleHomeKpi } from "../../../services/workerKpisService";
import { HomeKpiProgressRing } from "./HomeKpiProgressRing";
import { HomeRoleKpiChart, ROLE_KPI_TITLE_GREEN } from "./HomeRoleKpiCharts";

export type HomeRoleKpiProps = {
  kpi: WorkerRoleHomeKpi;
  onPress?: () => void;
};

export function HomeRoleKpi({ kpi, onPress }: HomeRoleKpiProps) {
  const homeColors = useHomeColors();
  const badge = kpi.chart?.badge;
  const hideCaption =
    Boolean(badge) ||
    (kpi.chart?.kind === "columns" && Boolean(kpi.chart?.payments?.length));

  return (
    <SoftPressable
      onPress={onPress}
      disabled={!onPress}
      feedback={Boolean(onPress)}
      scaleTo={0.98}
      style={[styles.card, { backgroundColor: homeColors.surface }]}
      accessibilityLabel={`${kpi.title} ${kpi.status}. ${kpi.caption}`}
    >
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {kpi.title}
          </Text>
          {badge ? (
            <View style={styles.reserveChip}>
              <Text style={styles.reserveChipText}>
                {badge.label} · {badge.value}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.status, { color: homeColors.ink }]} numberOfLines={1}>
          {kpi.status}
        </Text>
        {hideCaption ? null : (
          <Text
            style={[
              styles.caption,
              { color: homeColors.muted },
              kpi.tone === "pending" ? { color: homeColors.warning } : null,
            ]}
            numberOfLines={2}
          >
            {kpi.caption}
          </Text>
        )}
      </View>
      {kpi.chart ? (
        <View style={styles.chartBlock}>
          <HomeRoleKpiChart chart={kpi.chart} />
        </View>
      ) : (
        <View style={styles.ringWrap}>
          <HomeKpiProgressRing
            progress={kpi.progress}
            label={kpi.percentLabel}
            tone={kpi.tone}
            size={104}
          />
        </View>
      )}
    </SoftPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    marginBottom: 10,
    minHeight: 132,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: HOME_RADIUS.section,
    gap: 10,
  },
  copy: {
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: ROLE_KPI_TITLE_GREEN,
  },
  reserveChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#4E3629",
  },
  reserveChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  status: {
    marginTop: 4,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.7,
    fontVariant: ["tabular-nums"],
  },
  caption: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  chartBlock: {
    width: "100%",
  },
  ringWrap: {
    alignItems: "center",
  },
});
