import { partitionDriverHubRoutes } from "../../../domain/driverRouteHubVisibility";
import type { DriverAssignedRouteRecord } from "../../../services/driverRoutesService";
import type { WorkerRoleHomeKpi } from "../../../services/workerKpisService";

export function buildDriverRoleHomeKpi(
  routes: DriverAssignedRouteRecord[],
): WorkerRoleHomeKpi {
  const { inRoute, ready, pendingConfirm, completed, cancelled } =
    partitionDriverHubRoutes(routes);
  const inProgress = inRoute.length;
  const pending = pendingConfirm.length + ready.length;
  const done = completed.length;
  const dropped = cancelled.length;
  const active = inProgress + pending;
  const hasAny = active + done + dropped > 0;
  const isClear = active === 0;

  let status = "Sin rutas";
  let caption = "Aún no tienes rutas asignadas";
  if (hasAny && isClear) {
    status = "Al día";
    caption = done > 0 ? `${done} finalizada${done === 1 ? "" : "s"}` : "Sin rutas activas";
  } else if (inProgress > 0) {
    status = "En curso";
    caption = `${inProgress} en curso`;
  } else if (pending > 0) {
    status = "Pendiente";
    caption = `${pending} pendiente${pending === 1 ? "" : "s"}`;
  }

  return {
    title: "Rutas",
    status,
    caption,
    tone: !hasAny ? "neutral" : isClear ? "ok" : "pending",
    progress: isClear ? (hasAny ? 1 : 0) : inProgress / Math.max(active, 1),
    percentLabel: isClear ? (hasAny ? "100%" : "0") : String(active),
    action: "routes",
    chart: {
      kind: "columns",
      items: [
        { label: "En curso", value: inProgress },
        { label: "Pendientes", value: pending },
        { label: "Finalizadas", value: done },
        { label: "Canceladas", value: dropped },
      ],
    },
  };
}
