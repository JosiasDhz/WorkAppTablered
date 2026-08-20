import React, { useMemo, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft2 } from "iconsax-react-native";
import { SOFT } from "../theme/softUi";

const COLORS = {
  ink: SOFT.ink,
  muted: SOFT.mutedInk,
};

export type HeaderTitleProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  tone?: "light" | "dark" | "map";
  overlayOnMap?: boolean;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  rightAccessory?: ReactNode;
  leadingAccessory?: ReactNode;
  titleColor?: string;
  icon?: ReactNode;
};

export function HeaderTitle({
  title,
  subtitle,
  onBack,
  tone = "light",
  overlayOnMap = false,
  backgroundColor,
  style,
  rightAccessory,
  leadingAccessory,
  titleColor,
  icon,
}: HeaderTitleProps) {
  const navigation = useNavigation<any>();
  const handleBack = onBack ?? (() => navigation.goBack());
  const isDark = tone === "dark";
  const isMap = tone === "map" || overlayOnMap;
  const lightChrome = !isDark && !isMap;

  const titleSizeStyle = useMemo(() => {
    const len = title.length;
    if (len <= 18) return { fontSize: 26, letterSpacing: -0.6 as const };
    if (len <= 28) return { fontSize: 22, letterSpacing: -0.45 as const };
    return { fontSize: 19, letterSpacing: -0.3 as const };
  }, [title]);

  return (
    <View
      style={[
        styles.wrap,
        subtitle ? styles.wrapWithSubtitle : null,
        backgroundColor !== undefined ? { backgroundColor } : null,
        style,
      ]}
    >
      {leadingAccessory ? (
        <View style={styles.leadingSlot}>{leadingAccessory}</View>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.backBtn,
            isMap
              ? styles.backBtnOverlay
              : isDark
                ? styles.backBtnDark
                : styles.backBtnLight,
            pressed && lightChrome && styles.backBtnLightPressed,
            pressed && !lightChrome && styles.backBtnPressed,
          ]}
          onPress={handleBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ArrowLeft2
            size={20}
            color={lightChrome ? "#57534E" : isMap ? COLORS.ink : "#FFFFFF"}
            variant="Linear"
          />
        </Pressable>
      )}
      <View style={styles.textBlock}>
        <View style={styles.titleRow}>
          {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
          <Text
            style={[
              styles.title,
              titleSizeStyle,
              isMap
                ? styles.titleMap
                : isDark
                  ? styles.titleDark
                  : styles.titleLight,
              Platform.OS === "android" ? styles.titleAndroid : null,
              titleColor ? { color: titleColor } : null,
            ]}
            numberOfLines={2}
            {...(isMap
              ? {}
              : { adjustsFontSizeToFit: true, minimumFontScale: 0.86 })}
          >
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              isMap
                ? styles.subtitleMap
                : isDark
                  ? styles.subtitleDark
                  : styles.subtitleLight,
            ]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAccessory ? (
        <View style={styles.rightSlot}>{rightAccessory}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 12 : 0,
    paddingBottom: 12,
    gap: 12,
  },
  wrapWithSubtitle: {
    alignItems: "center",
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnLight: {
    backgroundColor: "#F3F1EC",
    borderWidth: 2,
    borderColor: "transparent",
  },
  backBtnLightPressed: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(234, 118, 0, 0.25)",
  },
  backBtnOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.62)",
  },
  backBtnDark: {
    backgroundColor: "rgba(28, 25, 23, 0.38)",
  },
  backBtnPressed: { opacity: 0.82 },
  leadingSlot: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconSlot: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontWeight: "700",
  },
  titleAndroid: {
    includeFontPadding: false,
  },
  titleLight: {
    color: COLORS.ink,
  },
  titleDark: {
    color: "#FFFFFF",
  },
  titleMap: {
    color: "#FFFFFF",
    textShadowColor: "rgba(28, 25, 23, 0.72)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  subtitle: {
    marginTop: 1,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  subtitleLight: {
    color: COLORS.muted,
  },
  subtitleDark: {
    color: "rgba(255, 255, 255, 0.82)",
  },
  subtitleMap: {
    color: "#FFFFFF",
    textShadowColor: "rgba(28, 25, 23, 0.68)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  rightSlot: {
    width: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
