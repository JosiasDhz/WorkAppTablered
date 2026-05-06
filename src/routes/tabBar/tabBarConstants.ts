import { Platform } from "react-native";

export const TAB_BAR_PRIMARY = "#EA7600";
export const TAB_BAR_PRIMARY_DEEP = "#C86800";
export const TAB_BAR_ACCENT = "#F7B917";
export const TAB_BAR_SIDE_ICON = "#5C5855";

export const TAB_BAR_BLUR = {
  iosIntensity: 82,
  androidIntensity: 92,
  androidBlurReductionFactor: 2,
  overlayIos: "rgba(255, 255, 255, 0.36)",
  overlayAndroid: "rgba(255, 255, 255, 0.34)",
} as const;

const FAB_DIAMETER = 74;

export const TAB_BAR_LAYOUT = {
  horizontalInset: 22,
  pillRadius: 30,
  innerPaddingH: 8,
  fabDiameter: FAB_DIAMETER,
  fabCenterSlotWidth: FAB_DIAMETER,
  fabOverlap: 0,
  barRowPaddingV: 8,
  barRowPaddingTopExtra: 2,
  sideTapPadding: 3,
  sideIconSize: 23,
} as const;

export const tabBarShadow = Platform.select({
  ios: {
    shadowColor: "#1D1D1B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
  },
  android: { elevation: 18 },
  default: {},
});

export const fabShadow = Platform.select({
  ios: {
    shadowColor: TAB_BAR_PRIMARY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.58,
    shadowRadius: 18,
  },
  android: { elevation: 20 },
  default: {},
});
