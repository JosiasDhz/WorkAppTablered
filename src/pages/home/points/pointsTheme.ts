import { useMemo } from "react";
import { useAppAppearance } from "../../../theme/appearance";
import { SOFT_LIGHT, type SoftPalette } from "../../../theme/softUi";

export type PointsColors = {
  surface: string;
  ink: string;
  heading: string;
  muted: string;
  divider: string;
  tableHeader: string;
  tableHeaderInk: string;
  accent: string;
  accentSoft: string;
  positive: string;
  positiveSoft: string;
  negative: string;
  negativeSoft: string;
};

export function buildPointsColors(
  soft: SoftPalette,
  scheme: "light" | "dark",
): PointsColors {
  return {
    surface: soft.surface,
    ink: soft.ink,
    heading: scheme === "dark" ? "#E7E5E4" : "#4E3629",
    muted: soft.mutedInk,
    divider: soft.border,
    tableHeader: soft.lime,
    tableHeaderInk: "#1C1917",
    accent: soft.accent,
    accentSoft: soft.accentSoft,
    positive: soft.emerald,
    positiveSoft: soft.emeraldSoft,
    negative: soft.roseText,
    negativeSoft: soft.roseSoft,
  };
}

export function usePointsColors(): PointsColors {
  const { colors, scheme } = useAppAppearance();
  return useMemo(() => buildPointsColors(colors, scheme), [colors, scheme]);
}

export const POINTS_COLORS = buildPointsColors(SOFT_LIGHT, "light");

export const POINTS_RADIUS = {
  card: 18,
  section: 16,
  well: 12,
} as const;

export const WALLET_CARD_RATIO = 663 / 368;
