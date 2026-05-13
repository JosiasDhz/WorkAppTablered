export type DriverRouteAssignmentDemoRecord = {
  id: string;
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

export type DriverRouteAssignmentDemoDestination = {
  id: string;
  visitOrder: number;
  pinColorHex: string;
  vehicle: DriverRouteAssignmentDemoVehicle;
  assignedDriver: DriverRouteAssignmentDemoDriver;
  records: DriverRouteAssignmentDemoRecord[];
};

export type DriverRouteAssignmentDemoRoute = {
  id: string;
  folio: string;
  status: string;
  notes: string | null;
  createdAtCdmx: string;
  originWarehouseId: string;
  originWarehouseName: string;
  lastUpdatedByWorkerId: string;
  lastUpdatedByWorkerName: string;
  lastUpdatedAtCdmx: string;
  savedDirectionsPolylinesByVehicleId: Record<string, string>;
};

export type DriverRouteAssignmentDemo = {
  route: DriverRouteAssignmentDemoRoute;
  destinations: DriverRouteAssignmentDemoDestination[];
};
