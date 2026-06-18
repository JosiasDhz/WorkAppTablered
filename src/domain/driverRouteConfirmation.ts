import type { DriverAssignedRouteRecord } from "../services/driverRoutesService";

export function isDriverRouteAwaitingWarehouseConfirmation(
  route: Pick<
    DriverAssignedRouteRecord,
    "pendingWarehouseConfirmationLinesCount" | "pendingWarehouseConfirmationUnits"
  >,
): boolean {
  return (
    Number(route.pendingWarehouseConfirmationLinesCount ?? 0) > 0 ||
    Number(route.pendingWarehouseConfirmationUnits ?? 0) > 0
  );
}

export function hasDriverRoutePendingDriverConfirmation(
  route: Pick<
    DriverAssignedRouteRecord,
    "pendingDriverConfirmationLinesCount" | "pendingDriverConfirmationUnits"
  >,
): boolean {
  return (
    Number(route.pendingDriverConfirmationLinesCount ?? 0) > 0 ||
    Number(route.pendingDriverConfirmationUnits ?? 0) > 0
  );
}

export function isDriverRouteWarehouseConfirmedAwaitingDriver(
  route: Pick<
    DriverAssignedRouteRecord,
    | "pendingDriverConfirmationLinesCount"
    | "pendingDriverConfirmationUnits"
    | "pendingWarehouseConfirmationLinesCount"
    | "pendingWarehouseConfirmationUnits"
  >,
): boolean {
  return (
    hasDriverRoutePendingDriverConfirmation(route) &&
    !isDriverRouteAwaitingWarehouseConfirmation(route)
  );
}

export function driverRouteConfirmationSummaryLabel(
  route: Pick<DriverAssignedRouteRecord, "pendingDriverConfirmationUnits">,
): string {
  const units = Number(route.pendingDriverConfirmationUnits ?? 0);
  if (units <= 0) return "Mercancía liberada en almacén";
  return `${units} ${units === 1 ? "unidad" : "unidades"} por confirmar`;
}
