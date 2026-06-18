export const TableRedColors = {
  marron: "#4E423A",
  corteza: "#696158",
  cortezaHover: "#80786E",
  naranja: "#EA7600",
  naranjaHover: "#FF8B17",
  azul: "#4E6D82",
  azulHover: "#3D5869",
  azulLight: "#5A7F96",
  verde: "#6B8570",
  verdeHover: "#5A7260",
  verdeLight: "#7A9580",
  ocre: "#CC9900",
  terracota: "#BF4F32",
  sabila: "#697E61",
  sabilaDark: "#5A6D53",
  crema: "#FAF9F1",
  gris: "#A2ABB6",
  white: "#FFFFFF",
  ink: "#4E423A",
  statVerdeText: "#4A5F4E",
  statAzulText: "#3D5869",
  statOcreText: "#8A6D00",
  line: "rgba(162, 171, 182, 0.35)",
  cardBorder: "rgba(162, 171, 182, 0.45)",
} as const;

export type DriverRouteCardToneKey =
  | "marron"
  | "azul"
  | "sabila"
  | "ocre"
  | "verde";

export type DriverRouteCardTone = {
  key: DriverRouteCardToneKey;
  header: [string, string];
  border: string;
  button: string;
  buttonPressed: string;
};

export type DriverRouteSummaryStripKind =
  | "pending-driver"
  | "pending-warehouse"
  | "in-process"
  | "ready"
  | "complete"
  | "info";

export type DriverRouteSummaryStripTone = {
  containerBg: string;
  containerBorder: string;
  accent: string;
  iconBg: string;
  title: string;
  subtitle: string;
  countBg: string;
  countText: string;
  countSuffix: string;
  pulse: boolean;
};

export const DRIVER_ROUTE_CARD_TONES: Record<
  DriverRouteCardToneKey,
  DriverRouteCardTone
> = {
  marron: {
    key: "marron",
    header: [TableRedColors.marron, TableRedColors.corteza],
    border: "rgba(78, 66, 58, 0.25)",
    button: TableRedColors.corteza,
    buttonPressed: TableRedColors.cortezaHover,
  },
  azul: {
    key: "azul",
    header: [TableRedColors.azul, TableRedColors.azulLight],
    border: "rgba(78, 109, 130, 0.3)",
    button: TableRedColors.azul,
    buttonPressed: TableRedColors.azulHover,
  },
  sabila: {
    key: "sabila",
    header: [TableRedColors.sabila, TableRedColors.sabilaDark],
    border: "rgba(105, 126, 97, 0.35)",
    button: TableRedColors.sabila,
    buttonPressed: TableRedColors.sabilaDark,
  },
  ocre: {
    key: "ocre",
    header: [TableRedColors.ocre, TableRedColors.naranja],
    border: "rgba(204, 153, 0, 0.4)",
    button: TableRedColors.naranja,
    buttonPressed: TableRedColors.naranjaHover,
  },
  verde: {
    key: "verde",
    header: [TableRedColors.verde, TableRedColors.verdeLight],
    border: "rgba(107, 133, 112, 0.35)",
    button: TableRedColors.verde,
    buttonPressed: TableRedColors.verdeHover,
  },
};

export const DRIVER_ROUTE_SUMMARY_STRIP_TONES: Record<
  DriverRouteSummaryStripKind,
  DriverRouteSummaryStripTone
> = {
  "pending-driver": {
    containerBg: "rgba(78, 109, 130, 0.08)",
    containerBorder: "rgba(78, 109, 130, 0.35)",
    accent: TableRedColors.azul,
    iconBg: TableRedColors.azul,
    title: TableRedColors.marron,
    subtitle: TableRedColors.azul,
    countBg: TableRedColors.azul,
    countText: TableRedColors.white,
    countSuffix: "rgba(255,255,255,0.82)",
    pulse: true,
  },
  "pending-warehouse": {
    containerBg: "rgba(105, 126, 97, 0.1)",
    containerBorder: "rgba(105, 126, 97, 0.35)",
    accent: TableRedColors.sabila,
    iconBg: TableRedColors.sabila,
    title: TableRedColors.marron,
    subtitle: TableRedColors.sabila,
    countBg: TableRedColors.sabila,
    countText: TableRedColors.white,
    countSuffix: "rgba(255,255,255,0.82)",
    pulse: false,
  },
  "in-process": {
    containerBg: "rgba(204, 153, 0, 0.1)",
    containerBorder: "rgba(204, 153, 0, 0.4)",
    accent: TableRedColors.ocre,
    iconBg: TableRedColors.ocre,
    title: TableRedColors.marron,
    subtitle: TableRedColors.statOcreText,
    countBg: TableRedColors.naranja,
    countText: TableRedColors.white,
    countSuffix: "rgba(255,255,255,0.82)",
    pulse: true,
  },
  ready: {
    containerBg: "rgba(107, 133, 112, 0.1)",
    containerBorder: "rgba(107, 133, 112, 0.35)",
    accent: TableRedColors.verde,
    iconBg: TableRedColors.verde,
    title: TableRedColors.marron,
    subtitle: TableRedColors.verdeHover,
    countBg: TableRedColors.verde,
    countText: TableRedColors.white,
    countSuffix: "rgba(255,255,255,0.82)",
    pulse: false,
  },
  complete: {
    containerBg: "rgba(107, 133, 112, 0.1)",
    containerBorder: "rgba(107, 133, 112, 0.35)",
    accent: TableRedColors.verde,
    iconBg: TableRedColors.verde,
    title: TableRedColors.marron,
    subtitle: TableRedColors.verde,
    countBg: TableRedColors.verde,
    countText: TableRedColors.white,
    countSuffix: "rgba(255,255,255,0.82)",
    pulse: false,
  },
  info: {
    containerBg: "rgba(162, 171, 182, 0.1)",
    containerBorder: "rgba(162, 171, 182, 0.4)",
    accent: TableRedColors.corteza,
    iconBg: TableRedColors.corteza,
    title: TableRedColors.marron,
    subtitle: TableRedColors.gris,
    countBg: TableRedColors.corteza,
    countText: TableRedColors.white,
    countSuffix: "rgba(255,255,255,0.82)",
    pulse: false,
  },
};
