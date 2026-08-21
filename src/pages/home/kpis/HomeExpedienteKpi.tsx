import React from "react";
import { StyleSheet, Text } from "react-native";
import { SoftPressable } from "../../../components/SoftPressable";
import { HOME_COLORS, HOME_RADIUS } from "../homeTheme";
import type { HomeKpiTone } from "./HomeKpiCard";
import { HomeKpiProgressRing } from "./HomeKpiProgressRing";

const TITLE_GREEN = "#16A34A";

export type HomeExpedienteKpiProps = {
  status: string;
  caption: string;
  tone: HomeKpiTone;
  progress: number;
  percentLabel: string;
  onPress: () => void;
};

export function HomeExpedienteKpiTitle({
  status,
  caption,
  onPress,
}: Omit<HomeExpedienteKpiProps, "progress" | "percentLabel">) {
  return (
    <SoftPressable
      onPress={onPress}
      scaleTo={1}
      style={styles.titleCard}
      accessibilityLabel={`Expediente ${status}. ${caption}`}
    >
      <Text style={styles.kicker}>Expediente</Text>
      <Text style={styles.status} numberOfLines={2}>
        {status}
      </Text>
      <Text style={styles.caption} numberOfLines={2}>
        {caption}
      </Text>
    </SoftPressable>
  );
}

export function HomeExpedienteKpiRing({
  status,
  caption,
  tone,
  progress,
  percentLabel,
  onPress,
}: HomeExpedienteKpiProps) {
  return (
    <SoftPressable
      onPress={onPress}
      scaleTo={1}
      style={styles.ringCard}
      accessibilityLabel={`Expediente ${percentLabel}. ${status}. ${caption}`}
    >
      <HomeKpiProgressRing
        progress={progress}
        label={percentLabel}
        tone={tone}
        size={112}
      />
    </SoftPressable>
  );
}

const styles = StyleSheet.create({
  titleCard: {
    flex: 1,
    minHeight: 156,
    marginRight: -10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: HOME_COLORS.surface,
    borderTopLeftRadius: HOME_RADIUS.section,
    borderBottomLeftRadius: HOME_RADIUS.section,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCard: {
    flex: 1,
    minHeight: 156,
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: HOME_COLORS.surface,
    borderTopRightRadius: HOME_RADIUS.section,
    borderBottomRightRadius: HOME_RADIUS.section,
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    fontSize: 15,
    fontWeight: "700",
    color: TITLE_GREEN,
    textAlign: "center",
  },
  status: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
    textAlign: "center",
    color: TITLE_GREEN,
  },
  caption: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    textAlign: "center",
    color: HOME_COLORS.muted,
  },
});
