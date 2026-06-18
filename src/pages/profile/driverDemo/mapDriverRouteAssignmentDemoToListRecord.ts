import type { DeliveryRouteStatusApi } from "../../../domain/driverRoutePending";
import type { DriverAssignedRouteRecord } from "../../../services/driverRoutesService";
import type { DriverRouteAssignmentDemo } from "./driverRouteAssignmentDemo.types";

function fullDriverName(
  d: DriverRouteAssignmentDemo["destinations"][0]["assignedDriver"],
) {
  if (!d) return null;
  return [d.name, d.lastName, d.secondLastName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function vehicleSummary(v: DriverRouteAssignmentDemo["destinations"][0]["vehicle"]) {
  if (!v) return null;
  const m = v.model?.trim();
  const p = v.plateNumber?.trim();
  if (m && p) return `${m} · ${p}`;
  return m || p || null;
}

export function mapDriverRouteAssignmentDemoToListRecord(
  input: DriverRouteAssignmentDemo,
): DriverAssignedRouteRecord {
  const { route, destinations } = input;
  let lineCount = 0;
  let unitSum = 0;
  for (const dest of destinations) {
    lineCount += dest.records.length;
    for (const rec of dest.records) {
      unitSum += rec.quantity;
    }
  }
  const first = destinations[0];
  const vehicleSummaryStr = first ? vehicleSummary(first.vehicle) : null;
  const driverSummaryStr = first ? fullDriverName(first.assignedDriver) : null;

  return {
    id: route.id,
    folio: route.folio,
    status: route.status as DeliveryRouteStatusApi,
    notes: route.notes ?? null,
    createdAtCdmx: route.createdAtCdmx,
    originWarehouseId: route.originWarehouseId,
    originWarehouseName: route.originWarehouseName,
    createdByWorkerId: null,
    createdByWorkerName: null,
    destinationsCount: destinations.length,
    assignedDestinationsCount: destinations.length,
    includedDeliveryLinesCount: lineCount,
    totalUnits: unitSum,
    assignedTotalUnits: unitSum,
    assignedVehiclesSummary: vehicleSummaryStr,
    assignedDriversSummary: driverSummaryStr || null,
    lastUpdatedByWorkerId: route.lastUpdatedByWorkerId,
    lastUpdatedByWorkerName: route.lastUpdatedByWorkerName,
    lastUpdatedAtCdmx: route.lastUpdatedAtCdmx,
    pendingDriverConfirmationLinesCount: lineCount,
    pendingDriverConfirmationUnits: unitSum,
    pendingWarehouseConfirmationLinesCount: 0,
    pendingWarehouseConfirmationUnits: 0,
    driverConfirmedLinesCount: 0,
  };
}
