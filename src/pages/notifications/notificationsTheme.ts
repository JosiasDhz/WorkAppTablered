import { useMemo } from "react";
import { useAppAppearance } from "../../theme/appearance";
import type { SoftPalette } from "../../theme/softUi";

export type NotificationColors = {
  surface: string;
  ink: string;
  muted: string;
  divider: string;
  accent: string;
  accentSoft: string;
  emerald: string;
  emeraldSoft: string;
  rose: string;
  roseSoft: string;
  warning: string;
  warningSoft: string;
  neutralSoft: string;
};

export function buildNotificationColors(
  soft: SoftPalette,
  _scheme: "light" | "dark",
): NotificationColors {
  return {
    surface: soft.surface,
    ink: soft.ink,
    muted: soft.mutedInk,
    divider: soft.border,
    accent: soft.accent,
    accentSoft: soft.accentSoft,
    emerald: soft.emerald,
    emeraldSoft: soft.emeraldSoft,
    rose: soft.roseText,
    roseSoft: soft.roseSoft,
    warning: soft.warningText,
    warningSoft: soft.warningBg,
    neutralSoft: soft.field,
  };
}

export function useNotificationColors(): NotificationColors {
  const { colors, scheme } = useAppAppearance();
  return useMemo(
    () => buildNotificationColors(colors, scheme),
    [colors, scheme],
  );
}

export const NOTIFICATION_COLORS = buildNotificationColors(
  {
    layout: "#F2F2F7",
    surface: "#FFFFFF",
    field: "#F3F1EC",
    fieldFocus: "#FFFFFF",
    ink: "#1C1917",
    muted: "#A8A29E",
    mutedInk: "#78716C",
    border: "#E7E5E4",
    accent: "#EA7600",
    accentSoft: "rgba(234, 118, 0, 0.12)",
    lime: "#C6C216",
    limeSoft: "rgba(198, 194, 22, 0.18)",
    rose: "#E11D48",
    roseSoft: "#FFF1F2",
    roseText: "#BE123C",
    emerald: "#047857",
    emeraldSoft: "#ECFDF5",
    warningBg: "#FFFBEB",
    warningBorder: "rgba(253, 230, 138, 0.9)",
    warningText: "#B45309",
  },
  "light",
);

export const NOTIFICATION_RADIUS = {
  section: 16,
  well: 12,
} as const;
