import React, { type ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { SoftPressable } from "../../../components/SoftPressable";
import { HOME_RADIUS, useHomeColors } from "../homeTheme";

export type HomeKpiTone = "ok" | "pending" | "neutral";

export type HomeKpiCardProps = {
  title?: string;
  status: string;
  caption: string;
  tone: HomeKpiTone;
  icon?: ReactNode;
  graphic?: ReactNode;
  accessibilityLabel: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function HomeKpiCard({
  title,
  status,
  caption,
  tone,
  icon,
  graphic,
  accessibilityLabel,
  onPress,
  style,
}: HomeKpiCardProps) {
  const homeColors = useHomeColors();
  const palette =
    tone === "ok"
      ? { wash: homeColors.positiveSoft, ink: homeColors.positive }
      : tone === "pending"
        ? { wash: homeColors.warningSoft, ink: homeColors.warning }
        : { wash: homeColors.accentSoft, ink: homeColors.accent };
  const centered = Boolean(graphic) || Boolean(icon);

  return (
    <SoftPressable
      onPress={onPress}
      disabled={!onPress}
      feedback={Boolean(onPress)}
      scaleTo={0.98}
      style={[
        styles.card,
        { backgroundColor: homeColors.surface },
        graphic ? styles.cardChart : null,
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      {graphic ? (
        <View style={styles.graphic}>{graphic}</View>
      ) : icon ? (
        <View
          style={[
            styles.iconSlot,
            styles.iconCentered,
            { backgroundColor: palette.wash },
          ]}
        >
          {icon}
        </View>
      ) : null}
      {title ? (
        <Text
          style={[
            styles.title,
            { color: homeColors.muted },
            centered ? styles.centered : null,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      ) : null}
      <Text
        style={[
          styles.status,
          { color: palette.ink },
          centered ? styles.centered : null,
          title ? null : styles.statusAfterGraphic,
        ]}
        numberOfLines={2}
      >
        {status}
      </Text>
      <Text
        style={[
          styles.caption,
          { color: homeColors.muted },
          centered ? styles.centered : null,
        ]}
        numberOfLines={2}
      >
        {caption}
      </Text>
    </SoftPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 148,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: HOME_RADIUS.section,
  },
  cardChart: {
    minHeight: 188,
  },
  graphic: {
    alignItems: "center",
  },
  iconSlot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCentered: {
    alignSelf: "center",
  },
  title: {
    marginTop: 10,
    fontSize: 12.5,
    fontWeight: "600",
  },
  status: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  statusAfterGraphic: {
    marginTop: 10,
  },
  caption: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  centered: {
    textAlign: "center",
  },
});
