import { SOFT } from "../../../theme/softUi";

export const POINTS_COLORS = {
  surface: SOFT.surface,
  ink: "#1C1C1E",
  heading: "#4E3629",
  muted: "#8E8E93",
  divider: "rgba(60, 60, 67, 0.12)",
  tableHeader: SOFT.lime,
  tableHeaderInk: "#FFFFFF",
  accent: SOFT.accent,
  accentSoft: SOFT.accentSoft,
  positive: SOFT.emerald,
  positiveSoft: SOFT.emeraldSoft,
  negative: SOFT.roseText,
  negativeSoft: SOFT.roseSoft,
} as const;

export const POINTS_RADIUS = {
  card: 18,
  section: 16,
  well: 12,
} as const;

export const WALLET_CARD_RATIO = 663 / 368;
