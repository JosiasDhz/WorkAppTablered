import { Platform, StyleSheet } from "react-native";
import { LOGIN_COLORS, LOGIN_LAYOUT } from "./constants";

export const loginCardShadow = Platform.select({
  ios: {
    shadowColor: LOGIN_COLORS.black,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
  },
  android: { elevation: 12 },
  default: {},
});

export const blurSectionStyle = {
  borderTopLeftRadius: LOGIN_LAYOUT.cardRadius,
  borderTopRightRadius: LOGIN_LAYOUT.cardRadius,
  paddingHorizontal: 24,
  paddingTop: 32,
  paddingBottom: 16,
  overflow: "hidden" as const,
};

export const cardFooterSolidStyle = {
  paddingHorizontal: 24,
  paddingTop: 8,
  paddingBottom: 28,
  backgroundColor: "rgba(255, 255, 255, 0.98)",
};

export const primaryButtonShadow = Platform.select({
  ios: {
    shadowColor: LOGIN_COLORS.orange,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  android: { elevation: 6 },
  default: {},
});

export const loginHeroStyles = StyleSheet.create({
  base: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: LOGIN_LAYOUT.heroBottomRadius,
    borderBottomRightRadius: LOGIN_LAYOUT.heroBottomRadius,
  },
});
