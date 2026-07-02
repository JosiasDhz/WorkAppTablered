export type DriverRouteAssignmentDemoRecord = {
  id: string;
  rowKind?: string | null;
  transferId?: string | null;
  saleId: string;
  saleFolio: string;
  saleCreatedAtCdmx: string;
  saleStatusName: string;
  saleStatusCode: string;
  productName: string;
  productImageFileId: string;
  quantity: number;
  volumeM3: string;
  weightKg: string;
  deliveryStatus: string;
  driverDeliveredAtCdmx?: string | null;
  driverDeliveredByWorkerId?: string | null;
  deliveryCompletionAtCdmx?: string | null;
  deliverySignatureDataUrl?: string | null;
  deliveryEvidenceFileIds?: string[];
  originWarehouseId: string;
  street: string;
  neighborhood: string;
  externalNumber: string;
  internalNumber: string | null;
  zipCode: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  mapSearchQuery: string;
};

export type DriverRouteAssignmentDemoVehicle = {
  id: string;
  status: string;
  serialNumber: string;
  model: string;
  year: number;
  plateNumber: string;
  description: string;
  capacityM3: string;
  maxLoadTons: string;
  maxLoadKg: string;
  type: string;
  warehouse: { id: string; name: string };
  createdAt: string;
};

export type DriverRouteAssignmentDemoDriver = {
  id: string;
  code: string;
  name: string;
  lastName: string;
  secondLastName: string | null;
};

export type DriverRouteAssignmentDemoDestinationPayment = {
  status: "PENDING" | "PAID";
  amountToCollectMxn: number;
};

export type DriverRouteAssignmentDemoDestinationCollection = {
  pendingAmountMxn: number;
  receivedMxn: number;
  changeMxn: number;
  netMxn: number;
  recordedAtCdmx: string | null;
  recordedByWorkerId: string | null;
};

export type DriverRouteAssignmentDemoDestination = {
  id: string;
  visitOrder: number;
  pinColorHex: string;
  vehicle: DriverRouteAssignmentDemoVehicle | null;
  assignedDriver: DriverRouteAssignmentDemoDriver | null;
  records: DriverRouteAssignmentDemoRecord[];
  payment?: DriverRouteAssignmentDemoDestinationPayment | null;
  collection?: DriverRouteAssignmentDemoDestinationCollection | null;
};

export type DriverRouteAssignmentDemoRoute = {
  id: string;
  folio: string;
  status: string;
  notes: string | null;
  createdAtCdmx: string;
  originWarehouseId: string;
  originWarehouseName: string;
  lastUpdatedByWorkerId: string | null;
  lastUpdatedByWorkerName: string | null;
  lastUpdatedAtCdmx: string | null;
  routeStartedByWorkerId?: string | null;
  routeStartedByWorkerName?: string | null;
  routeStartedAtCdmx?: string | null;
  routePickupStartedByWorkerId?: string | null;
  routePickupStartedByWorkerName?: string | null;
  routePickupStartedAtCdmx?: string | null;
  routeStartOdometerReading?: number | null;
  routeStartOdometerEvidenceFileId?: string | null;
  routeCompletedByWorkerId?: string | null;
  routeCompletedByWorkerName?: string | null;
  routeCompletedAtCdmx?: string | null;
  routeEndOdometerReading?: number | null;
  routeEndOdometerEvidenceFileId?: string | null;
  routeEndFuelEvidenceFileId?: string | null;
  driverCashPendingHandoverMxn?: number;
  driverCashHandoverAmountMxn?: number;
  driverCashHandoverAtCdmx?: string | null;
  driverCashHandoverByWorkerId?: string | null;
  savedDirectionsPolylinesByVehicleId: Record<string, string> | null;
};

export type DriverRouteAssignmentDemo = {
  route: DriverRouteAssignmentDemoRoute;
  destinations: DriverRouteAssignmentDemoDestination[];
};
