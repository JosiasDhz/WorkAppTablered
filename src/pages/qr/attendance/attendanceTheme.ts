import { useMemo } from "react";
import { useAppAppearance } from "../../../theme/appearance";
import type { SoftPalette } from "../../../theme/softUi";

export type AttendanceColors = {
  surface: string;
  ink: string;
  muted: string;
  divider: string;
  accent: string;
  accentSoft: string;
  urgent: string;
  urgentSoft: string;
  success: string;
  successInk: string;
  qrForeground: string;
  qrPlate: string;
};

export function buildAttendanceColors(
  soft: SoftPalette,
  scheme: "light" | "dark",
): AttendanceColors {
  const dark = scheme === "dark";
  return {
    surface: soft.surface,
    ink: soft.ink,
    muted: soft.mutedInk,
    divider: soft.border,
    accent: soft.accent,
    accentSoft: soft.accentSoft,
    urgent: dark ? "#F87171" : "#DC2626",
    urgentSoft: dark ? "rgba(248, 113, 113, 0.18)" : "rgba(220, 38, 38, 0.12)",
    success: dark ? "#34D399" : "#059669",
    successInk: dark ? "#A7F3D0" : "#065F46",
    qrForeground: dark ? "#FAFAF9" : "#0F172A",
    qrPlate: dark ? soft.field : "#FFFFFF",
  };
}

export function useAttendanceColors(): AttendanceColors {
  const { colors, scheme } = useAppAppearance();
  return useMemo(() => buildAttendanceColors(colors, scheme), [colors, scheme]);
}

export const ATTENDANCE_COLORS = buildAttendanceColors(
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

export const ATTENDANCE_RADIUS = {
  card: 18,
  section: 16,
} as const;
