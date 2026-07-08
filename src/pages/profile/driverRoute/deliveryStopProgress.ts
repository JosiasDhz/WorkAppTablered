export type DeliveryStopStepState = "done" | "current" | "upcoming";

export type DeliveryStopProgressStep = {
  key: string;
  shortLabel: string;
  label: string;
  state: DeliveryStopStepState;
};

export type DeliveryStopProgressRow = {
  deliveryStatus?: string | null;
  isTransfer?: boolean;
};

export type RouteProgressStop = {
  delivered: boolean;
};

export function isDriverRouteLineDelivered(
  deliveryStatus: string | null | undefined,
  isTransfer: boolean,
): boolean {
  const status = String(deliveryStatus ?? "").trim().toUpperCase();
  if (isTransfer) return status === "ENTREGADO_CHOFER" || status === "RECIBIDO";
  return status === "ENTREGADO";
}

export function isDriverRouteStopDelivered(input: {
  rows: DeliveryStopProgressRow[];
  routeInProcess: boolean;
  routeComplete: boolean;
}): boolean {
  if (!input.routeInProcess && !input.routeComplete) return false;
  if (input.rows.length === 0) return false;
  return input.rows.every((row) =>
    isDriverRouteLineDelivered(row.deliveryStatus, row.isTransfer === true),
  );
}

const GENERAL_STEP_DEFS = [
  { key: "assigned", shortLabel: "Asignado", label: "Asignado a ruta" },
  { key: "warehouse", shortLabel: "Almacén", label: "Confirmado en almacén" },
  { key: "pickup", shortLabel: "Confirmando", label: "Confirmando mercancía" },
  { key: "transit", shortLabel: "En camino", label: "En proceso de envío" },
] as const;

const STOP_ORDINALS = [
  "Primera",
  "Segunda",
  "Tercera",
  "Cuarta",
  "Quinta",
  "Sexta",
  "Séptima",
  "Octava",
  "Novena",
  "Décima",
];

const GENERAL_STEP_COUNT = GENERAL_STEP_DEFS.length;

function buildStopStepDefs(stopCount: number) {
  const defs: Array<{ key: string; shortLabel: string; label: string }> = [];
  for (let i = 0; i < stopCount; i += 1) {
    const n = i + 1;
    const ordinal = STOP_ORDINALS[i] ?? `${n}ª`;
    defs.push({
      key: `stop-${n}`,
      shortLabel: `${n}ª entrega`,
      label: `${ordinal} entrega`,
    });
  }
  return defs;
}

const FINISHED_STEP_DEF = {
  key: "finished",
  shortLabel: "Finalizado",
  label: "Ruta finalizada",
} as const;

const SALE_STATUS_RANK: Record<string, number> = {
  PENDIENTE: 0,
  LISTO_PARA_ENVIO: 1,
  ASIGNADO_A_RUTA: 2,
  CONFIRMADO_ALMACEN: 3,
  CONFIRMADO_CHOFER: 4,
  EN_PROCESO_DE_ENVIO: 5,
  ENTREGADO: 6,
};

const TRANSFER_STATUS_RANK: Record<string, number> = {
  PENDIENTE: 0,
  LISTO_PARA_ENVIO: 1,
  ASIGNADO_A_RUTA: 2,
  CONFIRMADO_ALMACEN: 3,
  CONFIRMADO_CHOFER: 4,
  EN_PROCESO_DE_ENVIO: 5,
  ENTREGADO_CHOFER: 6,
  RECIBIDO: 7,
};

function maxStatusRank(rows: DeliveryStopProgressRow[], isTransfer: boolean): number {
  const rankMap = isTransfer ? TRANSFER_STATUS_RANK : SALE_STATUS_RANK;
  let max = 0;
  for (const row of rows) {
    const status = String(row.deliveryStatus ?? "")
      .trim()
      .toUpperCase();
    const rank = rankMap[status] ?? 0;
    if (rank > max) max = rank;
  }
  return max;
}

function maxStatusRankForRoute(rows: DeliveryStopProgressRow[]): number {
  let max = 0;
  for (const row of rows) {
    const rank = maxStatusRank([row], row.isTransfer === true);
    if (rank > max) max = rank;
  }
  return max;
}

function resolveRoutePhaseIndex(
  routeStatus: string,
  maxRank: number,
  routeInProcess: boolean,
): number {
  const status = routeStatus.trim().toUpperCase();
  if (status === "COMPLETA") return 4;
  if (routeInProcess || status === "EN_PROCESO") return 3;
  if (status === "LEVANTAMIENTO") return 3;
  if (status === "CONFIRMADA") return 2;
  if (status === "GUARDADA") {
    if (maxRank >= 3) return 2;
    if (maxRank >= 2) return 1;
    return 0;
  }
  return 0;
}

function resolveCurrentStepIndex(
  maxRank: number,
  routeInProcess: boolean,
  showDelivered: boolean,
): number {
  if (showDelivered || maxRank >= 6) return 4;
  if (maxRank >= 5 || (routeInProcess && maxRank >= 4)) return 3;
  if (maxRank >= 4) return 2;
  if (maxRank >= 3) return 1;
  if (maxRank >= 2) return 0;
  return 0;
}

export function buildDeliveryStopProgressSteps(input: {
  rows: DeliveryStopProgressRow[];
  isTransfer: boolean;
  routeInProcess: boolean;
  showDelivered: boolean;
}): DeliveryStopProgressStep[] {
  const { rows, isTransfer, routeInProcess, showDelivered } = input;
  const maxRank = maxStatusRank(rows, isTransfer);
  const currentIndex = resolveCurrentStepIndex(maxRank, routeInProcess, showDelivered);
  const allComplete = showDelivered || maxRank >= 6;

  const finalShortLabel = isTransfer ? "Recibido" : "Entregado";
  const finalLabel = isTransfer ? "Entregado / recibido" : "Entregado al cliente";

  const defs = [
    { key: "assigned", shortLabel: "Asignado", label: "Asignado a ruta" },
    { key: "warehouse", shortLabel: "Almacén", label: "Confirmado en almacén" },
    { key: "pickup", shortLabel: "Confirmando", label: "Confirmando mercancía" },
    { key: "transit", shortLabel: "En camino", label: "En proceso de envío" },
    { key: "delivered", shortLabel: finalShortLabel, label: finalLabel },
  ];

  return defs.map((def, index) => ({
    ...def,
    state: allComplete
      ? "done"
      : index < currentIndex
        ? "done"
        : index === currentIndex
          ? "current"
          : "upcoming",
  }));
}

export function deliveryStopProgressHeadline(steps: DeliveryStopProgressStep[]): string {
  const current = steps.find((s) => s.state === "current");
  if (current) return current.label;
  const allDone = steps.every((s) => s.state === "done");
  if (allDone) return steps[steps.length - 1]?.label ?? "Completado";
  return steps[0]?.label ?? "En seguimiento";
}

export function buildRouteProgressSteps(input: {
  rows: DeliveryStopProgressRow[];
  stops: RouteProgressStop[];
  routeStatus: string;
  routeInProcess: boolean;
  routeComplete: boolean;
}): DeliveryStopProgressStep[] {
  const { rows, stops, routeStatus, routeInProcess, routeComplete } = input;
  const maxRank = maxStatusRankForRoute(rows);
  const phaseCap = Math.min(
    resolveRoutePhaseIndex(routeStatus, maxRank, routeInProcess),
    3,
  );
  const allStopsDelivered = stops.length > 0 && stops.every((stop) => stop.delivered);
  const inDeliveryPhase = routeInProcess || routeComplete;
  const firstPendingStopIndex = stops.findIndex((stop) => !stop.delivered);

  const defs = [
    ...GENERAL_STEP_DEFS,
    ...buildStopStepDefs(stops.length),
    FINISHED_STEP_DEF,
  ];

  return defs.map((def, index) => {
    if (routeComplete) {
      return { ...def, state: "done" as const };
    }

    if (index < GENERAL_STEP_COUNT) {
      if (inDeliveryPhase) {
        return { ...def, state: "done" as const };
      }
      if (index < phaseCap) {
        return { ...def, state: "done" as const };
      }
      if (index === phaseCap) {
        return { ...def, state: "current" as const };
      }
      return { ...def, state: "upcoming" as const };
    }

    const stopIndex = index - GENERAL_STEP_COUNT;
    if (stopIndex < stops.length) {
      if (!inDeliveryPhase) {
        return { ...def, state: "upcoming" as const };
      }
      const stop = stops[stopIndex]!;
      if (stop.delivered) {
        return { ...def, state: "done" as const };
      }
      if (stopIndex === firstPendingStopIndex) {
        return { ...def, state: "current" as const };
      }
      return { ...def, state: "upcoming" as const };
    }

    if (allStopsDelivered) {
      return { ...def, state: "current" as const };
    }
    return { ...def, state: "upcoming" as const };
  });
}

export function deliveryRouteProgressHeadline(steps: DeliveryStopProgressStep[]): string {
  return deliveryStopProgressHeadline(steps);
}
