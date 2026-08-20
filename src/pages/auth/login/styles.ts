import { Platform } from "react-native";
import { LOGIN_COLORS, LOGIN_LAYOUT } from "./constants";

export const blurSectionStyle = {
  borderTopLeftRadius: LOGIN_LAYOUT.cardRadius,
  borderTopRightRadius: LOGIN_LAYOUT.cardRadius,
  paddingHorizontal: 24,
  paddingTop: 32,
  paddingBottom: 16,
  overflow: "hidden" as const,
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
