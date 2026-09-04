import { useMemo } from "react";
import { useAppAppearance } from "../../../theme/appearance";
import { SOFT_LIGHT, type SoftPalette } from "../../../theme/softUi";

export type LoginColors = {
  orange: string;
  warmGrey: string;
  muted: string;
  black: string;
  surface: string;
  field: string;
  fieldFocus: string;
  layout: string;
  accentSoft: string;
  placeholder: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
};

export function buildLoginColors(
  soft: SoftPalette,
  scheme: "light" | "dark",
): LoginColors {
  return {
    orange: soft.accent,
    warmGrey: soft.mutedInk,
    muted: soft.muted,
    black: soft.ink,
    surface: soft.surface,
    field: soft.field,
    fieldFocus: soft.fieldFocus,
    layout: soft.layout,
    accentSoft: soft.accentSoft,
    placeholder: soft.muted,
    errorBg: soft.roseSoft,
    errorBorder:
      scheme === "dark" ? "rgba(251, 113, 133, 0.32)" : "rgba(225, 29, 72, 0.18)",
    errorText: soft.roseText,
  };
}

export function useLoginColors(): LoginColors {
  const { colors, scheme } = useAppAppearance();
  return useMemo(() => buildLoginColors(colors, scheme), [colors, scheme]);
}

export const LOGIN_COLORS = buildLoginColors(SOFT_LIGHT, "light");

export const LOGIN_LAYOUT = {
  cardRadius: 16,
  maxWidth: 420,
} as const;

function greetingByHour(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function getLoginGreeting(now = new Date()): string {
  return greetingByHour(now.getHours());
}

export const LOGIN_COPY = {
  brand: "Table Red",
  brandSub: "Oaxaca",
  subtitle: "Accede para continuar con tu jornada.",
  userLabel: "Usuario",
  passwordLabel: "Contraseña",
  userPlaceholder: "correo o teléfono",
  passwordPlaceholder: "••••••••",
  submit: "Ingresar",
  submitting: "Ingresando…",
  footer: "Table Red · Arauco Oaxaca",
  genericError: "Ocurrio un error, intentelo mas tarde",
  quickHelp: "Ayuda",
  quickSecure: "Seguridad",
  quickWorker: "Trabajador",
  quickIdentity: "Identidad",
} as const;

export const LOGO_SIZE = { width: 88, height: 88 } as const;
