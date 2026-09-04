export type SoftPalette = {
  layout: string;
  surface: string;
  field: string;
  fieldFocus: string;
  ink: string;
  muted: string;
  mutedInk: string;
  border: string;
  accent: string;
  accentSoft: string;
  lime: string;
  limeSoft: string;
  rose: string;
  roseSoft: string;
  roseText: string;
  emerald: string;
  emeraldSoft: string;
  warningBg: string;
  warningBorder: string;
  warningText: string;
};

export const SOFT_LIGHT: SoftPalette = {
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
};

export const SOFT_DARK: SoftPalette = {
  layout: "#141210",
  surface: "#1F1C1A",
  field: "#2A2623",
  fieldFocus: "#322E2B",
  ink: "#FAFAF9",
  muted: "#78716C",
  mutedInk: "#A8A29E",
  border: "#3F3A36",
  accent: "#EA7600",
  accentSoft: "rgba(234, 118, 0, 0.22)",
  lime: "#C6C216",
  limeSoft: "rgba(198, 194, 22, 0.22)",
  rose: "#FB7185",
  roseSoft: "rgba(225, 29, 72, 0.18)",
  roseText: "#FDA4AF",
  emerald: "#34D399",
  emeraldSoft: "rgba(4, 120, 87, 0.22)",
  warningBg: "rgba(180, 83, 9, 0.2)",
  warningBorder: "rgba(253, 230, 138, 0.35)",
  warningText: "#FBBF24",
};

export const SOFT = SOFT_LIGHT;
