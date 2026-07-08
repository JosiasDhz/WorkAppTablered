export const DELIVERY_ROUTE_PROGRESS_ACCENT = {
  complete: "#10B981",
  inProcess: "#EA7600",
  pending: "#0284C7",
} as const;

export type DeliveryRouteProgressRailSize = "md" | "lg";

export const DELIVERY_ROUTE_PROGRESS_RAIL_METRICS = {
  md: {
    dot: 20,
    dotInner: 8,
    check: 10,
    connector: 2,
    label: 8,
    labelScroll: 7,
    stepColScroll: 56,
    rowHeight: 20,
  },
  lg: {
    dot: 26,
    dotInner: 10,
    check: 13,
    connector: 3,
    label: 9,
    labelScroll: 8,
    stepColScroll: 68,
    rowHeight: 26,
  },
} as const;
