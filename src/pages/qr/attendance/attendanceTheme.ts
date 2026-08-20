import { SOFT } from "../../../theme/softUi";

export const ATTENDANCE_COLORS = {
  surface: SOFT.surface,
  ink: "#1C1C1E",
  muted: "#8E8E93",
  divider: "rgba(60, 60, 67, 0.12)",
  accent: SOFT.accent,
  accentSoft: "rgba(234, 118, 0, 0.12)",
  urgent: "#DC2626",
  urgentSoft: "rgba(220, 38, 38, 0.12)",
  success: "#059669",
  successInk: "#065F46",
  qrForeground: "#0F172A",
} as const;

export const ATTENDANCE_RADIUS = {
  card: 18,
  section: 16,
} as const;
