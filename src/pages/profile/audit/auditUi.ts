import { useMemo } from "react";
import { Platform, StyleSheet, type ViewStyle } from "react-native";
import { useAppAppearance } from "../../../theme/appearance";
import { SOFT_LIGHT, type SoftPalette } from "../../../theme/softUi";

export type AuditUi = {
  surface: string;
  ink: string;
  muted: string;
  divider: string;
  field: string;
  accent: string;
  accentSoft: string;
  blue: string;
  blueSoft: string;
  green: string;
  greenSoft: string;
  amber: string;
  amberSoft: string;
  rose: string;
  roseSoft: string;
  onTone: string;
  shadow: string;
};

export function buildAuditUi(
  soft: SoftPalette,
  scheme: "light" | "dark",
): AuditUi {
  const dark = scheme === "dark";
  return {
    surface: soft.surface,
    ink: soft.ink,
    muted: soft.mutedInk,
    divider: soft.border,
    field: soft.field,
    accent: soft.accent,
    accentSoft: dark ? "rgba(234, 118, 0, 0.24)" : "rgba(234, 118, 0, 0.14)",
    blue: dark ? "#60A5FA" : "#2563EB",
    blueSoft: dark ? "rgba(96, 165, 250, 0.2)" : "rgba(37, 99, 235, 0.12)",
    green: dark ? "#34D399" : "#16A34A",
    greenSoft: dark ? "rgba(52, 211, 153, 0.2)" : "rgba(22, 163, 74, 0.16)",
    amber: dark ? "#FBBF24" : "#B45309",
    amberSoft: dark ? "rgba(251, 191, 36, 0.2)" : "rgba(245, 158, 11, 0.18)",
    rose: soft.roseText,
    roseSoft: soft.roseSoft,
    onTone: dark ? "#141210" : "#FFFFFF",
    shadow: dark ? "#000000" : "#1A1410",
  };
}

export function useAuditUi(): AuditUi {
  const { colors, scheme } = useAppAppearance();
  return useMemo(() => buildAuditUi(colors, scheme), [colors, scheme]);
}

export const AUDIT_UI = buildAuditUi(SOFT_LIGHT, "light");

export function auditSoftCardStyle(ui: AuditUi = AUDIT_UI): ViewStyle {
  return {
    backgroundColor: ui.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.divider,
    ...Platform.select({
      ios: {
        shadowColor: ui.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 1 },
      default: {},
    }),
  };
}
