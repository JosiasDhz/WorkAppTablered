import { useMemo } from "react";
import { useAppAppearance } from "../../theme/appearance";
import type { SoftPalette } from "../../theme/softUi";

export type HomeColors = {
  heading: string;
  ink: string;
  muted: string;
  surface: string;
  accent: string;
  accentSoft: string;
  positive: string;
  positiveSoft: string;
  warning: string;
  warningSoft: string;
  track: string;
};

export function buildHomeColors(
  soft: SoftPalette,
  scheme: "light" | "dark",
): HomeColors {
  return {
    heading: scheme === "dark" ? "#E7E5E4" : "#4E3629",
    ink: soft.ink,
    muted: soft.mutedInk,
    surface: soft.surface,
    accent: soft.accent,
    accentSoft: soft.accentSoft,
    positive: soft.emerald,
    positiveSoft: soft.emeraldSoft,
    warning: soft.warningText,
    warningSoft: soft.warningBg,
    track:
      scheme === "dark" ? "rgba(255,255,255,0.14)" : "rgba(60, 60, 67, 0.12)",
  };
}

export function useHomeColors(): HomeColors {
  const { colors, scheme } = useAppAppearance();
  return useMemo(() => buildHomeColors(colors, scheme), [colors, scheme]);
}

export const HOME_COLORS = buildHomeColors(
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

export const HOME_RADIUS = {
  section: 22,
} as const;
