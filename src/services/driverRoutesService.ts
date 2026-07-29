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
  driverCashPendingHandoverMxn?: number;
  driverCashHandoverAtCdmx?: string | null;
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

export type DriverCollectionRecord = {
  destinationId: string;
  routeId: string;
  routeFolio: string;
  routeStatus: string;
  saleFolio: string | null;
  addressLine: string | null;
  pendingAmountMxn: number;
  receivedMxn: number;
  changeMxn: number;
  netMxn: number;
  recordedAtCdmx: string | null;
  collectorWorkerCode: string | null;
  collectorWorkerName: string | null;
  routeCashHandedOver: boolean;
  routeCashHandoverAtCdmx: string | null;
  collectionStatus: "POR_COBRAR" | "COBRADO" | "ENTREGADO_CAJA";
};

export type DriverCollectionsResponse = {
  records: DriverCollectionRecord[];
  totalRecords: number;
  summary: {
    totalPorCobrarMxn: number;
    totalCobradoMxn: number;
    totalEntregadoCajaMxn: number;
    countPorCobrar: number;
    countCobrado: number;
    countEntregadoCaja: number;
  };
};

export async function fetchDriverCollections(params?: {
  limit?: number;
  offset?: number;
  term?: string;
  status?: "PENDING" | "DELIVERED";
}) {
  const { data } = await http.get<DriverCollectionsResponse>(
    "/driver-routes/my-collections",
    { params },
  );
  return data;
}
