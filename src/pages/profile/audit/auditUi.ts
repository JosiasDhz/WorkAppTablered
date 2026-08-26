import { Platform, StyleSheet, type ViewStyle } from "react-native";
import { SOFT } from "../../../theme/softUi";

export const AUDIT_UI = {
  surface: SOFT.surface,
  ink: "#1C1C1E",
  muted: "#8E8E93",
  divider: "rgba(60, 60, 67, 0.12)",
  field: SOFT.field,
  accent: SOFT.accent,
  accentSoft: "rgba(234, 118, 0, 0.14)",
  blue: "#2563EB",
  blueSoft: "rgba(37, 99, 235, 0.12)",
  green: "#16A34A",
  greenSoft: "rgba(22, 163, 74, 0.16)",
  amber: "#B45309",
  amberSoft: "rgba(245, 158, 11, 0.18)",
  rose: "#BE123C",
  roseSoft: "#FFF1F2",
} as const;

export function auditSoftCardStyle(): ViewStyle {
  return {
    backgroundColor: AUDIT_UI.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AUDIT_UI.divider,
    ...Platform.select({
      ios: {
        shadowColor: "#1A1410",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 1 },
      default: {},
    }),
  };
}
