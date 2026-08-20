import { Platform } from "react-native";

export const TAB_BAR_PRIMARY = "#EA7600";
export const TAB_BAR_PRIMARY_DEEP = "#C86800";
export const TAB_BAR_ACCENT = "#F7B917";
export const TAB_BAR_CAFE = "#696158";
export const TAB_BAR_CAFE_ANDROID = "#524646";
export const TAB_BAR_FAB = TAB_BAR_PRIMARY;
export const TAB_BAR_SURFACE =
  Platform.OS === "android" ? TAB_BAR_CAFE_ANDROID : TAB_BAR_CAFE;
export const TAB_BAR_FOCUSED = "#FFFFFF";
export const TAB_BAR_UNFOCUSED = "rgba(255,255,255,0.45)";
export const TAB_BAR_SIDE_ICON = "#FFFFFF";

export const TAB_BAR_BLUR = {
  iosIntensity: 82,
  androidIntensity: 92,
  androidBlurReductionFactor: 2,
  overlayIos: "rgba(255, 255, 255, 0.36)",
  overlayAndroid: "rgba(255, 255, 255, 0.34)",
} as const;

const FAB_DIAMETER = 74;

export const TAB_BAR_LAYOUT = {
  horizontalInset: 16,
  pillRadius: 36,
  innerPaddingH: 4,
  fabDiameter: FAB_DIAMETER,
  fabCenterSlotWidth: FAB_DIAMETER,
  fabOverlap: 0,
  barRowPaddingV: 4,
  barRowPaddingTopExtra: 0,
  sideTapPadding: 3,
  sideIconSize: 24,
  profileCircle: 62,
  pillProfileGap: 10,
} as const;

export const tabBarShadow = Platform.select({
  ios: {
    shadowColor: "#1D1D1B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
  },
  android: { elevation: 14 },
  default: {},
});

export const fabShadow = Platform.select({
  ios: {
    shadowColor: TAB_BAR_FAB,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.58,
    shadowRadius: 18,
  },
  android: { elevation: 20 },
  default: {},
});
