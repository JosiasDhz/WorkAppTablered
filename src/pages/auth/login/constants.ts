/** Colores de marca usados solo en la pantalla de login (evita acoplar a un theme global aún). */
export const LOGIN_COLORS = {
  orange: "#EA7600",
  warmGrey: "#696158",
  black: "#1D1D1B",
} as const;

export const LOGIN_LAYOUT = {
  cardRadius: 24,
  heroBottomRadius: 32,
  heroHeightRatio: 0.56,
  heroInsetCap: 280,
  scrollPaddingTop: 16,
  cardOffsetDown: 55,
} as const;

export const LOGIN_COPY = {
  title: "Bienvenido",
  subtitle: "Accede para continuar.",
  userLabel: "Usuario",
  passwordLabel: "Contraseña",
  userPlaceholder: "correo o usuario",
  passwordPlaceholder: "••••••••",
  submit: "Ingresar",
  submitting: "Ingresando…",
  footer: "Table Red · Oaxaca",
  genericError: "Ocurrio un error, intentelo mas tarde",
} as const;

export const LOGIN_BLUR = {
  iosIntensity: 52,
  androidIntensity: 55,
  androidBlurReductionFactor: 3,
  overlayIos: "rgba(255, 255, 255, 0.70)",
  overlayAndroid: "rgba(255, 255, 255, 0.55)",
} as const;

export const LOGO_SIZE = { width: 72, height: 72, marginRight: 14 } as const;
