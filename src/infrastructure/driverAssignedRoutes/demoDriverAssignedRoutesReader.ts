import {
  isDriverRouteHubVisible,
  partitionDriverHubRoutes,
} from "../../domain/driverRouteHubVisibility";
import type { DriverAssignedRoutesReader } from "../../domain/driverAssignedRoutes/DriverAssignedRoutesReader";
import { DRIVER_ROUTE_ASSIGNMENT_DEMO } from "../../pages/profile/driverDemo/driverRouteAssignmentDemoPayload";
import { mapDriverRouteAssignmentDemoToListRecord } from "../../pages/profile/driverDemo/mapDriverRouteAssignmentDemoToListRecord";
import type { DriverAssignedRouteRecord } from "../../services/driverRoutesService";

function buildInRouteDemoRecord(): DriverAssignedRouteRecord {
  const base = mapDriverRouteAssignmentDemoToListRecord(DRIVER_ROUTE_ASSIGNMENT_DEMO);
  return {
    ...base,
    id: `${base.id}-en-ruta`,
    folio: `${base.folio}-ACTIVA`,
    status: "EN_PROCESO",
    pendingDriverConfirmationLinesCount: 0,
    pendingDriverConfirmationUnits: 0,
    pendingWarehouseConfirmationLinesCount: 0,
    pendingWarehouseConfirmationUnits: 0,
    driverConfirmedLinesCount: base.includedDeliveryLinesCount,
  };
}

function buildReadyDemoRecord(): DriverAssignedRouteRecord {
  const base = mapDriverRouteAssignmentDemoToListRecord(DRIVER_ROUTE_ASSIGNMENT_DEMO);
  return {
    ...base,
    id: `${base.id}-lista`,
    folio: `${base.folio}-LISTA`,
    status: "CONFIRMADA",
    pendingDriverConfirmationLinesCount: 0,
    pendingDriverConfirmationUnits: 0,
    pendingWarehouseConfirmationLinesCount: 0,
    pendingWarehouseConfirmationUnits: 0,
    driverConfirmedLinesCount: base.includedDeliveryLinesCount,
  };
}

export function createDemoDriverAssignedRoutesReader(): DriverAssignedRoutesReader {
  return {
    async fetchHubRoutes() {
      const pending = mapDriverRouteAssignmentDemoToListRecord(DRIVER_ROUTE_ASSIGNMENT_DEMO);
      const ready = buildReadyDemoRecord();
      const inRoute = buildInRouteDemoRecord();
      return [pending, ready, inRoute].filter(isDriverRouteHubVisible);
    },
  };
}

export function demoDriverHubPartitions() {
  return partitionDriverHubRoutes(
    [mapDriverRouteAssignmentDemoToListRecord(DRIVER_ROUTE_ASSIGNMENT_DEMO), buildInRouteDemoRecord()].filter(
      isDriverRouteHubVisible,
    ),
  );
}
