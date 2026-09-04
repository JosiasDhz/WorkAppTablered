import { Platform, type ViewStyle } from "react-native";
import { DRIVER_UI, type DriverUi } from "./driverUi";

export function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function driverRouteGlassBlurBg(ui: DriverUi = DRIVER_UI): string {
  if (ui.isDark) {
    return Platform.OS === "ios"
      ? "rgba(31, 28, 26, 0.7)"
      : "rgba(31, 28, 26, 0.82)";
  }
  return Platform.OS === "ios"
    ? "rgba(250, 249, 241, 0.48)"
    : "rgba(250, 249, 241, 0.52)";
}

export function driverRouteGlassPanelShell(
  ui: DriverUi = DRIVER_UI,
): ViewStyle {
  return {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: ui.glassBorder,
  };
}

export function driverRouteGlassCardStyle(
  color: string,
  active: boolean,
  ui: DriverUi = DRIVER_UI,
): ViewStyle {
  return {
    borderWidth: 1,
    borderColor: rgba(color, ui.isDark ? 0.42 : 0.32),
    borderLeftWidth: 3,
    borderLeftColor: color,
    backgroundColor: ui.surface,
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: active ? color : ui.shadow,
        shadowOffset: { width: 0, height: active ? 6 : 2 },
        shadowOpacity: active ? 0.16 : 0.06,
        shadowRadius: active ? 18 : 8,
      },
      android: { elevation: active ? 6 : 2 },
    }),
  };
}
