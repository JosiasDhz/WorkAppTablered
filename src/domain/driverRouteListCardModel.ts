import type { DriverAssignedRouteRecord } from "../services/driverRoutesService";
import {
  DRIVER_ROUTE_CARD_TONES,
  type DriverRouteCardTone,
  type DriverRouteCardToneKey,
  type DriverRouteSummaryStripKind,
} from "../theme/tableRedColors";
import {
  hasDriverRoutePendingDriverConfirmation,
  isDriverRouteAwaitingWarehouseConfirmation,
} from "./driverRouteConfirmation";

export type DriverRouteListCardModel = {
  operationalStatusLabel: string;
  isEnProceso: boolean;
  isCompleta: boolean;
  destinations: number;
  lines: number;
  units: number;
  driverFullyConfirmed: boolean;
  pendingDriverUnits: number;
  pendingWarehouseUnits: number;
  warehousePendingOnly: boolean;
  driverPendingOnly: boolean;
  summaryUnits: number;
  vehiclesLine: string | null;
  toneKey: DriverRouteCardToneKey;
  summaryStripKind: DriverRouteSummaryStripKind;
  summaryTitle: string;
  summarySubtitle: string | null;
  summaryCountSuffix: string | null;
};

function isDriverRouteFullyConfirmed(
  route: Pick<
    DriverAssignedRouteRecord,
    | "pendingDriverConfirmationLinesCount"
    | "pendingWarehouseConfirmationLinesCount"
    | "driverConfirmedLinesCount"
  >,
): boolean {
  const pendingDriverLines = Number(
    route.pendingDriverConfirmationLinesCount ?? 0,
  );
  const pendingWarehouseLines = Number(
    route.pendingWarehouseConfirmationLinesCount ?? 0,
  );
  const driverConfirmed = Number(route.driverConfirmedLinesCount ?? 0);
  if (pendingDriverLines > 0 || pendingWarehouseLines > 0) return false;
  return driverConfirmed > 0;
}

function buildOperationalStatusLabel(input: {
  isCompleta: boolean;
  isEnProceso: boolean;
  driverFullyConfirmed: boolean;
  warehousePendingOnly: boolean;
  driverPendingOnly: boolean;
}): string {
  if (input.isCompleta) return "Completa";
  if (input.isEnProceso) return "En ruta";
  if (input.driverFullyConfirmed) return "Lista";
  if (input.driverPendingOnly) return "Por confirmar";
  if (input.warehousePendingOnly) return "Esperando almacén";
  return "Asignada";
}

function buildPendingSummary(
  model: Pick<
    DriverRouteListCardModel,
    | "warehousePendingOnly"
    | "driverPendingOnly"
    | "summaryUnits"
  >,
): {
  title: string;
  subtitle: string | null;
  countSuffix: string | null;
} {
  const unitsLabel = `unidad${model.summaryUnits === 1 ? "" : "es"}`;
  if (model.warehousePendingOnly) {
    return {
      title: "Esperando confirmación del almacén",
      subtitle: null,
      countSuffix:
        model.summaryUnits > 0 ? `${unitsLabel} en almacén` : null,
    };
  }
  if (model.driverPendingOnly) {
    return {
      title: "Mercancía liberada",
      subtitle: "Confirma recepción",
      countSuffix:
        model.summaryUnits > 0 ? `${unitsLabel} por confirmar` : null,
    };
  }
  return {
    title: "Mercancía pendiente de confirmar",
    subtitle: null,
    countSuffix:
      model.summaryUnits > 0 ? `${unitsLabel} pendientes` : null,
  };
}

function resolveToneKey(model: {
  isCompleta: boolean;
  isEnProceso: boolean;
  driverFullyConfirmed: boolean;
  driverPendingOnly: boolean;
  warehousePendingOnly: boolean;
}): DriverRouteCardToneKey {
  if (model.isCompleta) return "verde";
  if (model.isEnProceso) return "ocre";
  if (model.driverFullyConfirmed) return "verde";
  if (model.driverPendingOnly) return "azul";
  if (model.warehousePendingOnly) return "sabila";
  return "marron";
}

function resolveSummaryStripKind(model: {
  isCompleta: boolean;
  isEnProceso: boolean;
  driverFullyConfirmed: boolean;
  warehousePendingOnly: boolean;
  driverPendingOnly: boolean;
}): DriverRouteSummaryStripKind {
  if (model.isCompleta) return "complete";
  if (model.isEnProceso) return "in-process";
  if (model.driverFullyConfirmed) return "ready";
  if (model.warehousePendingOnly) return "pending-warehouse";
  if (model.driverPendingOnly) return "pending-driver";
  return "info";
}

export function buildDriverRouteListCardModel(
  route: DriverAssignedRouteRecord,
): DriverRouteListCardModel {
  const pendingDriverUnits = Number(route.pendingDriverConfirmationUnits ?? 0);
  const pendingWarehouseUnits = Number(
    route.pendingWarehouseConfirmationUnits ?? 0,
  );
  const hasWarehousePending = isDriverRouteAwaitingWarehouseConfirmation(route);
  const hasDriverPending = hasDriverRoutePendingDriverConfirmation(route);
  const driverFullyConfirmed = isDriverRouteFullyConfirmed(route);
  const warehousePendingOnly = hasWarehousePending && !hasDriverPending;
  const driverPendingOnly = hasDriverPending && !hasWarehousePending;
  const statusLabel = String(route.status ?? "").trim().toUpperCase();
  const isEnProceso = statusLabel === "EN_PROCESO";
  const isCompleta = statusLabel === "COMPLETA";
  const summaryUnits =
    pendingDriverUnits > 0 ? pendingDriverUnits : pendingWarehouseUnits;

  const toneKey = resolveToneKey({
    isCompleta,
    isEnProceso,
    driverFullyConfirmed,
    driverPendingOnly,
    warehousePendingOnly,
  });
  const summaryStripKind = resolveSummaryStripKind({
    isCompleta,
    isEnProceso,
    driverFullyConfirmed,
    warehousePendingOnly,
    driverPendingOnly,
  });

  let summaryTitle = "";
  let summarySubtitle: string | null = null;
  let summaryCountSuffix: string | null = null;

  if (isCompleta) {
    summaryTitle = "Ruta finalizada";
  } else if (isEnProceso) {
    summaryTitle = "Entregas en curso";
  } else if (driverFullyConfirmed) {
    summaryTitle = "Lista para salir a entrega";
  } else {
    const pending = buildPendingSummary({
      warehousePendingOnly,
      driverPendingOnly,
      summaryUnits,
    });
    summaryTitle = pending.title;
    summarySubtitle = pending.subtitle;
    summaryCountSuffix = pending.countSuffix;
  }

  return {
    operationalStatusLabel: buildOperationalStatusLabel({
      isCompleta,
      isEnProceso,
      driverFullyConfirmed,
      warehousePendingOnly,
      driverPendingOnly,
    }),
    isEnProceso,
    isCompleta,
    destinations: Number(route.assignedDestinationsCount ?? 0),
    lines: Number(route.includedDeliveryLinesCount ?? 0),
    units: Number(route.assignedTotalUnits ?? 0),
    driverFullyConfirmed,
    pendingDriverUnits,
    pendingWarehouseUnits,
    warehousePendingOnly,
    driverPendingOnly,
    summaryUnits,
    vehiclesLine: String(route.assignedVehiclesSummary ?? "").trim() || null,
    toneKey,
    summaryStripKind,
    summaryTitle,
    summarySubtitle,
    summaryCountSuffix,
  };
}

export function getDriverRouteCardTone(
  toneKey: DriverRouteCardToneKey,
): DriverRouteCardTone {
  return DRIVER_ROUTE_CARD_TONES[toneKey];
}
