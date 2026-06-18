import http from "../api/http-common";
import type { DeliveryRouteStatusApi } from "../domain/driverRoutePending";

export type DriverAssignedRouteRecord = {
  id: string;
  folio: string;
  status: DeliveryRouteStatusApi;
  notes: string | null;
  createdAtCdmx: string;
  originWarehouseId: string;
  originWarehouseName: string;
  createdByWorkerId: string | null;
  createdByWorkerName: string | null;
  destinationsCount: number;
  assignedDestinationsCount: number;
  includedDeliveryLinesCount: number;
  totalUnits: number;
  assignedTotalUnits: number;
  assignedVehiclesSummary: string | null;
  assignedDriversSummary: string | null;
  lastUpdatedByWorkerId: string | null;
  lastUpdatedByWorkerName: string | null;
  lastUpdatedAtCdmx: string | null;
  pendingDriverConfirmationLinesCount?: number;
  pendingDriverConfirmationUnits?: number;
  pendingWarehouseConfirmationLinesCount?: number;
  pendingWarehouseConfirmationUnits?: number;
  driverConfirmedLinesCount?: number;
};

export type DriverAssignedRoutesResponse = {
  records: DriverAssignedRouteRecord[];
  totalRecords: number;
};

export type DriverAssignedRoutesListMode = "confirm" | "map";

export async function fetchDriverAssignedRoutes(params?: {
  limit?: number;
  offset?: number;
  term?: string;
  status?: DeliveryRouteStatusApi;
  listMode?: DriverAssignedRoutesListMode;
}) {
  const { data } = await http.get<DriverAssignedRoutesResponse>(
    "/driver-routes/assigned",
    { params },
  );
  return data;
}
