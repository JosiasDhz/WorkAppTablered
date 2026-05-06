import React, { useMemo, type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft2 } from "iconsax-react-native";

const COLORS = {
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  border: "#EEF1F4",
};

export type HeaderTitleProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  tone: "light" | "dark";
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  rightAccessory?: ReactNode;
};

export function HeaderTitle({
  title,
  subtitle,
  onBack,
  tone,
  backgroundColor,
  style,
  rightAccessory,
}: HeaderTitleProps) {
  const navigation = useNavigation<any>();
  const handleBack = onBack ?? (() => navigation.goBack());
  const isDark = tone === "dark";

  const titleSizeStyle = useMemo(() => {
    const len = title.length;
    if (len <= 22) return { fontSize: 25 };
    if (len <= 34) return { fontSize: 22, letterSpacing: -0.2 as const };
    return { fontSize: 19, letterSpacing: -0.25 as const };
  }, [title]);

  return (
    <View
      style={[
        styles.wrap,
        backgroundColor !== undefined ? { backgroundColor } : null,
        style,
      ]}
    >
      <TouchableOpacity
        style={[styles.backBtn, isDark ? styles.backBtnDark : styles.backBtnLight]}
        onPress={handleBack}
        activeOpacity={0.85}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Volver"
      >
        <ArrowLeft2
          size={18}
          color={isDark ? "#FFFFFF" : COLORS.text}
          variant="Outline"
        />
      </TouchableOpacity>
      <View style={styles.textBlock}>
        <Text
          style={[
            styles.title,
            titleSizeStyle,
            isDark ? styles.titleDark : styles.titleLight,
          ]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.88}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              isDark ? styles.subtitleDark : styles.subtitleLight,
            ]}
            numberOfLines={3}
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
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  backBtnLight: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtnDark: {
    backgroundColor: "rgba(15, 23, 42, 0.38)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  title: {
    fontWeight: "900",
  },
  titleLight: {
    color: COLORS.text,
  },
  titleDark: {
    color: "#FFFFFF",
  },
  subtitle: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
  subtitleLight: {
    color: COLORS.muted,
  },
  subtitleDark: {
    color: "rgba(255, 255, 255, 0.82)",
  },
  rightSlot: {
    width: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 2,
  },
});
