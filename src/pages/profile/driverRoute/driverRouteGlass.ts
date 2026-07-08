import { Platform, type ViewStyle } from "react-native";

export function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const driverRouteGlassBlurBg =
  Platform.OS === "ios" ? "rgba(250, 249, 241, 0.48)" : "rgba(250, 249, 241, 0.52)";

export const driverRouteGlassPanelShell: ViewStyle = {
  borderRadius: 16,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.55)",
};

export function driverRouteGlassCardStyle(color: string, active: boolean): ViewStyle {
  return {
    borderWidth: 1,
    borderColor: rgba(color, 0.32),
    borderLeftWidth: 3,
    borderLeftColor: color,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: active ? color : "#4E423A",
        shadowOffset: { width: 0, height: active ? 6 : 2 },
        shadowOpacity: active ? 0.16 : 0.06,
        shadowRadius: active ? 18 : 8,
      },
      android: { elevation: active ? 6 : 2 },
    }),
  };
}
