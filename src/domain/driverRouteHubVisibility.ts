import type { DriverAssignedRouteRecord } from "../services/driverRoutesService";
import { buildDriverRouteListCardModel } from "./driverRouteListCardModel";

function routeStatus(route: DriverAssignedRouteRecord): string {
  return String(route.status ?? "").trim().toUpperCase();
}

export function isDriverRouteHubVisible(route: DriverAssignedRouteRecord): boolean {
  if (routeStatus(route) === "CANCELADA") return true;
  const model = buildDriverRouteListCardModel(route);
  if (model.isCompleta) return true;
  return (
    model.driverPendingOnly ||
    model.driverFullyConfirmed ||
    model.isEnProceso
  );
}

export function partitionDriverHubRoutes(routes: DriverAssignedRouteRecord[]): {
  inRoute: DriverAssignedRouteRecord[];
  ready: DriverAssignedRouteRecord[];
  pendingConfirm: DriverAssignedRouteRecord[];
  completed: DriverAssignedRouteRecord[];
  cancelled: DriverAssignedRouteRecord[];
} {
  const inRoute: DriverAssignedRouteRecord[] = [];
  const ready: DriverAssignedRouteRecord[] = [];
  const pendingConfirm: DriverAssignedRouteRecord[] = [];
  const completed: DriverAssignedRouteRecord[] = [];
  const cancelled: DriverAssignedRouteRecord[] = [];

  for (const route of routes) {
    if (routeStatus(route) === "CANCELADA") {
      cancelled.push(route);
      continue;
    }
    const model = buildDriverRouteListCardModel(route);
    if (model.isCompleta) {
      completed.push(route);
      continue;
    }
    if (model.isEnProceso) {
      inRoute.push(route);
      continue;
    }
    if (model.driverFullyConfirmed) {
      ready.push(route);
      continue;
    }
    if (model.driverPendingOnly) {
      pendingConfirm.push(route);
    }
  }

  return { inRoute, ready, pendingConfirm, completed, cancelled };
}

export function resolveDriverHubRouteDestination(
  _route: DriverAssignedRouteRecord,
): "detail" | "confirm" {
  return "detail";
}
