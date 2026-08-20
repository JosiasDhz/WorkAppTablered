import { SOFT } from "../../../theme/softUi";

export const LOGIN_COLORS = {
  orange: SOFT.accent,
  warmGrey: SOFT.mutedInk,
  muted: SOFT.muted,
  black: SOFT.ink,
  surface: SOFT.surface,
  field: SOFT.field,
  layout: SOFT.layout,
  accentSoft: SOFT.accentSoft,
} as const;

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
  userPlaceholder: "correo o usuario",
  passwordPlaceholder: "••••••••",
  submit: "Ingresar",
  submitting: "Ingresando…",
  enterPassword: "Ingresar con contraseña",
  backWelcome: "Volver",
  footer: "Table Red · Arauco Oaxaca",
  genericError: "Ocurrio un error, intentelo mas tarde",
  quickHelp: "Ayuda",
  quickSecure: "Seguridad",
  quickWorker: "Trabajador",
  quickIdentity: "Identidad",
} as const;

export const LOGO_SIZE = { width: 88, height: 88 } as const;
