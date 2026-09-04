import { useMemo } from "react";
import { useAppAppearance } from "../../../theme/appearance";
import { SOFT_LIGHT, type SoftPalette } from "../../../theme/softUi";

export type DriverUi = {
  layout: string;
  surface: string;
  surfaceAlt: string;
  field: string;
  ink: string;
  muted: string;
  faint: string;
  border: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  accentInk: string;
  accentInkStrong: string;
  onAccent: string;
  blue: string;
  blueSoft: string;
  blueBorder: string;
  green: string;
  greenSoft: string;
  greenBorder: string;
  amber: string;
  amberSoft: string;
  amberBorder: string;
  rose: string;
  roseSoft: string;
  roseBorder: string;
  violet: string;
  violetSoft: string;
  violetBorder: string;
  shadow: string;
  overlay: string;
  glassBg: string;
  glassBorder: string;
  isDark: boolean;
};

export function buildDriverUi(
  soft: SoftPalette,
  scheme: "light" | "dark",
): DriverUi {
  const dark = scheme === "dark";
  return {
    layout: soft.layout,
    surface: soft.surface,
    surfaceAlt: dark ? "#26221F" : "#F8FAFC",
    field: soft.field,
    ink: soft.ink,
    muted: soft.mutedInk,
    faint: soft.muted,
    border: soft.border,
    accent: soft.accent,
    accentSoft: dark ? "rgba(234, 118, 0, 0.2)" : "#FFF7ED",
    accentBorder: dark ? "rgba(234, 118, 0, 0.42)" : "#FED7AA",
    accentInk: dark ? "#FDBA74" : "#C2410C",
    accentInkStrong: dark ? "#FED7AA" : "#9A3412",
    onAccent: "#FFFFFF",
    blue: dark ? "#60A5FA" : "#2563EB",
    blueSoft: dark ? "rgba(96, 165, 250, 0.18)" : "#EFF6FF",
    blueBorder: dark ? "rgba(96, 165, 250, 0.34)" : "#BFDBFE",
    green: dark ? "#34D399" : "#059669",
    greenSoft: dark ? "rgba(52, 211, 153, 0.16)" : "#ECFDF5",
    greenBorder: dark ? "rgba(52, 211, 153, 0.34)" : "#A7F3D0",
    amber: dark ? "#FBBF24" : "#D97706",
    amberSoft: dark ? "rgba(251, 191, 36, 0.16)" : "#FFFBEB",
    amberBorder: dark ? "rgba(251, 191, 36, 0.34)" : "#FDE68A",
    rose: dark ? "#FB7185" : "#DC2626",
    roseSoft: dark ? "rgba(251, 113, 133, 0.16)" : "#FEF2F2",
    roseBorder: dark ? "rgba(251, 113, 133, 0.32)" : "#FECACA",
    violet: dark ? "#C4B5FD" : "#7C3AED",
    violetSoft: dark ? "rgba(196, 181, 253, 0.16)" : "#F5F3FF",
    violetBorder: dark ? "rgba(196, 181, 253, 0.32)" : "#DDD6FE",
    shadow: dark ? "#000000" : "#0F172A",
    overlay: dark ? "rgba(0, 0, 0, 0.62)" : "rgba(15, 23, 42, 0.45)",
    glassBg: dark ? "rgba(31, 28, 26, 0.72)" : "rgba(250, 249, 241, 0.5)",
    glassBorder: dark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.55)",
    isDark: dark,
  };
}

export function useDriverUi(): DriverUi {
  const { colors, scheme } = useAppAppearance();
  return useMemo(() => buildDriverUi(colors, scheme), [colors, scheme]);
}

export const DRIVER_UI = buildDriverUi(SOFT_LIGHT, "light");
