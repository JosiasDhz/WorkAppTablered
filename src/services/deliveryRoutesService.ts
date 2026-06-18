import http, { httpFormDataClient } from "../api/http-common";

export type SavedDeliveryRouteAssignedDriver = {
  id: string;
  code: string | null;
  name: string | null;
  lastName: string | null;
  secondLastName: string | null;
};

export type SavedDeliveryRouteVehicle = {
  id: string;
  status?: string;
  serialNumber?: string;
  model?: string;
  year?: number;
  plateNumber?: string;
  description?: string;
  capacityM3?: string;
  maxLoadTons?: string;
  maxLoadKg?: string;
  type?: string;
  warehouse?: { id: string; name: string } | null;
  createdAt?: string;
};

export type SavedDeliveryRouteRecord = {
  id: string;
  rowKind?: string | null;
  saleId?: string;
  saleFolio?: string;
  saleCreatedAtCdmx?: string;
  saleStatusName?: string;
  saleStatusCode?: string;
  productName?: string;
  productImageFileId?: string;
  quantity?: number;
  volumeM3?: string;
  weightKg?: string;
  deliveryStatus?: string;
  warehouseConfirmedAtCdmx?: string | null;
  warehouseConfirmedByWorkerId?: string | null;
  driverConfirmedAtCdmx?: string | null;
  driverConfirmedByWorkerId?: string | null;
  driverDeliveredAtCdmx?: string | null;
  driverDeliveredByWorkerId?: string | null;
  deliveryCompletionAtCdmx?: string | null;
  deliverySignatureDataUrl?: string | null;
  deliveryEvidenceFileIds?: string[];
  transferId?: string | null;
  originWarehouseId?: string;
  street?: string;
  neighborhood?: string;
  externalNumber?: string;
  internalNumber?: string | null;
  zipCode?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  mapSearchQuery?: string;
};

export type SavedDeliveryRouteDestinationDetail = {
  id: string;
  visitOrder: number | null;
  pinColorHex: string | null;
  vehicle: SavedDeliveryRouteVehicle | null;
  assignedDriver?: SavedDeliveryRouteAssignedDriver | null;
  records: SavedDeliveryRouteRecord[];
};

export type SavedDeliveryRouteDetailResponse = {
  route: {
    id: string;
    folio: string;
    status: string;
    notes: string | null;
    createdAtCdmx: string;
    originWarehouseId: string;
    originWarehouseName: string;
    lastUpdatedByWorkerId?: string | null;
    lastUpdatedByWorkerName?: string | null;
    lastUpdatedAtCdmx?: string | null;
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
    savedDirectionsPolylinesByVehicleId?: Record<string, string> | null;
  };
  destinations: SavedDeliveryRouteDestinationDetail[];
};

export async function fetchSavedDeliveryRouteDetail(
  routeId: string,
): Promise<SavedDeliveryRouteDetailResponse> {
  const { data } = await http.get<SavedDeliveryRouteDetailResponse>(
    `/delivery-routes/saved/${routeId}`,
  );
  return data;
}

export type BeginDeliveryRoutePickupResponse = {
  routeId: string;
  status: string;
  routePickupStartedAtCdmx: string;
  routePickupStartedByWorkerId: string;
};

export async function beginDeliveryRoutePickup(
  routeId: string,
): Promise<BeginDeliveryRoutePickupResponse> {
  const { data } = await http.post<BeginDeliveryRoutePickupResponse>(
    `/delivery-routes/saved/${routeId}/begin-pickup`,
  );
  return data;
}

export type UploadedDeliveryRouteEvidenceFile = {
  id: string;
  name: string;
  extension: string;
  mimetype: string;
};

export async function uploadDeliveryRouteVehicleEvidence(asset: {
  uri: string;
  name: string;
  mimeType: string;
}): Promise<UploadedDeliveryRouteEvidenceFile> {
  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType,
  } as unknown as Blob);

  const { data } = await httpFormDataClient.post<UploadedDeliveryRouteEvidenceFile>(
    "/files/upload?purpose=evidence",
    formData,
  );
  if (!data?.id) {
    throw new Error("No se recibió el identificador de la evidencia");
  }
  return data;
}

export type StartDeliveryRoutePayload = {
  workerCode: string;
  odometerReading: number;
  odometerEvidenceFileId: string;
};

export type StartDeliveryRouteResponse = {
  routeId: string;
  status: string;
  routeStartedAtCdmx: string;
  routeStartedByWorkerId: string;
};

export async function startDeliveryRoute(
  routeId: string,
  payload: StartDeliveryRoutePayload,
): Promise<StartDeliveryRouteResponse> {
  const { data } = await http.post<StartDeliveryRouteResponse>(
    `/delivery-routes/saved/${routeId}/start`,
    payload,
  );
  return data;
}

export type ConfirmDriverRouteDeliveriesPayload = {
  workerCode: string;
  cartItemDeliveryIds?: string[];
  transferIds?: string[];
  evidenceFileIds?: string[];
  signatureDataUrl?: string;
};

export type ConfirmDriverRouteDeliveriesResponse = {
  routeId: string;
  confirmedCount: number;
  deliveryIds: string[];
  transferIds: string[];
};

export async function confirmDriverRouteDeliveries(
  routeId: string,
  payload: ConfirmDriverRouteDeliveriesPayload,
): Promise<ConfirmDriverRouteDeliveriesResponse> {
  const { data } = await http.post<ConfirmDriverRouteDeliveriesResponse>(
    `/delivery-routes/saved/${routeId}/confirm-driver`,
    payload,
  );
  return data;
}

export type MarkDeliveryRouteStopPayload = {
  workerCode: string;
  cartItemDeliveryIds?: string[];
  transferIds?: string[];
  evidenceFileIds?: string[];
  signatureDataUrl?: string;
  signatureEvidenceFileId?: string;
};

export type MarkDeliveryRouteStopResponse = {
  routeId: string;
  deliveredCount: number;
  deliveryIds: string[];
  transferIds: string[];
  finalizedReservationIds: string[];
};

export async function uploadDeliveryRouteSignatureDataUrl(
  signatureDataUrl: string,
): Promise<UploadedDeliveryRouteEvidenceFile> {
  return uploadDeliveryRouteVehicleEvidence({
    uri: signatureDataUrl,
    name: `delivery-signature-${Date.now()}.png`,
    mimeType: "image/png",
  });
}

export async function markDeliveryRouteStopDelivered(
  routeId: string,
  payload: MarkDeliveryRouteStopPayload,
): Promise<MarkDeliveryRouteStopResponse> {
  const { data } = await http.post<MarkDeliveryRouteStopResponse>(
    `/delivery-routes/saved/${routeId}/mark-delivered`,
    payload,
    { timeout: 120000 },
  );
  return data;
}

export type FinalizeDeliveryRoutePayload = {
  workerCode: string;
  odometerReading: number;
  odometerEvidenceFileId: string;
  fuelEvidenceFileId: string;
};

export type FinalizeDeliveryRouteResponse = {
  routeId: string;
  status: string;
  routeCompletedAtCdmx: string;
  routeCompletedByWorkerId: string;
  routeEndOdometerReading: number;
  routeEndOdometerEvidenceFileId: string;
  routeEndFuelEvidenceFileId: string;
};

export async function finalizeDeliveryRoute(
  routeId: string,
  payload: FinalizeDeliveryRoutePayload,
): Promise<FinalizeDeliveryRouteResponse> {
  const { data } = await http.post<FinalizeDeliveryRouteResponse>(
    `/delivery-routes/saved/${routeId}/finalize`,
    payload,
  );
  return data;
}
