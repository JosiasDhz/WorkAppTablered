import { SOFT } from "../../theme/softUi";

export const NOTIFICATION_COLORS = {
  surface: SOFT.surface,
  ink: "#1C1C1E",
  muted: "#8E8E93",
  divider: "rgba(60, 60, 67, 0.12)",
  accent: SOFT.accent,
  accentSoft: SOFT.accentSoft,
  emerald: SOFT.emerald,
  emeraldSoft: SOFT.emeraldSoft,
  rose: SOFT.roseText,
  roseSoft: SOFT.roseSoft,
  warning: SOFT.warningText,
  warningSoft: SOFT.warningBg,
  neutralSoft: SOFT.field,
} as const;

export const NOTIFICATION_RADIUS = {
  section: 16,
  well: 12,
} as const;
