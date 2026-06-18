import type { DriverRouteAssignment } from "../../domain/driverRouteAssignment/DriverRouteAssignmentReader";
import type { SavedDeliveryRouteDetailResponse } from "../../services/deliveryRoutesService";

function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

export function normalizeDriverRouteAssignmentFromApi(
  raw: SavedDeliveryRouteDetailResponse,
): DriverRouteAssignment {
  return {
    route: {
      id: raw.route.id,
      folio: raw.route.folio,
      status: raw.route.status,
      notes: raw.route.notes ?? null,
      createdAtCdmx: raw.route.createdAtCdmx,
      originWarehouseId: raw.route.originWarehouseId,
      originWarehouseName: raw.route.originWarehouseName,
      lastUpdatedByWorkerId: raw.route.lastUpdatedByWorkerId ?? null,
      lastUpdatedByWorkerName: raw.route.lastUpdatedByWorkerName ?? null,
      lastUpdatedAtCdmx: raw.route.lastUpdatedAtCdmx ?? null,
      routeStartedByWorkerId: raw.route.routeStartedByWorkerId ?? null,
      routeStartedByWorkerName: raw.route.routeStartedByWorkerName ?? null,
      routeStartedAtCdmx: raw.route.routeStartedAtCdmx ?? null,
      routePickupStartedByWorkerId: raw.route.routePickupStartedByWorkerId ?? null,
      routePickupStartedByWorkerName: raw.route.routePickupStartedByWorkerName ?? null,
      routePickupStartedAtCdmx: raw.route.routePickupStartedAtCdmx ?? null,
      routeStartOdometerReading: raw.route.routeStartOdometerReading ?? null,
      routeStartOdometerEvidenceFileId: raw.route.routeStartOdometerEvidenceFileId ?? null,
      routeCompletedByWorkerId: raw.route.routeCompletedByWorkerId ?? null,
      routeCompletedByWorkerName: raw.route.routeCompletedByWorkerName ?? null,
      routeCompletedAtCdmx: raw.route.routeCompletedAtCdmx ?? null,
      routeEndOdometerReading: raw.route.routeEndOdometerReading ?? null,
      routeEndOdometerEvidenceFileId: raw.route.routeEndOdometerEvidenceFileId ?? null,
      routeEndFuelEvidenceFileId: raw.route.routeEndFuelEvidenceFileId ?? null,
      savedDirectionsPolylinesByVehicleId:
        raw.route.savedDirectionsPolylinesByVehicleId ?? null,
    },
    destinations: raw.destinations.map((dest) => ({
      id: dest.id,
      visitOrder: dest.visitOrder ?? 0,
      pinColorHex: dest.pinColorHex ?? "#EA7600",
      vehicle: dest.vehicle
        ? {
            id: dest.vehicle.id,
            status: asString(dest.vehicle.status),
            serialNumber: asString(dest.vehicle.serialNumber),
            model: asString(dest.vehicle.model),
            year: Number(dest.vehicle.year) || 0,
            plateNumber: asString(dest.vehicle.plateNumber),
            description: asString(dest.vehicle.description),
            capacityM3: asString(dest.vehicle.capacityM3),
            maxLoadTons: asString(dest.vehicle.maxLoadTons),
            maxLoadKg: asString(dest.vehicle.maxLoadKg),
            type: asString(dest.vehicle.type),
            warehouse: dest.vehicle.warehouse
              ? {
                  id: dest.vehicle.warehouse.id,
                  name: dest.vehicle.warehouse.name,
                }
              : { id: "", name: "" },
            createdAt: asString(dest.vehicle.createdAt),
          }
        : null,
      assignedDriver: dest.assignedDriver
        ? {
            id: dest.assignedDriver.id,
            code: asString(dest.assignedDriver.code),
            name: asNullableString(dest.assignedDriver.name) ?? "",
            lastName: asNullableString(dest.assignedDriver.lastName) ?? "",
            secondLastName: dest.assignedDriver.secondLastName ?? null,
          }
        : null,
      records: dest.records.map((rec) => ({
        id: rec.id,
        rowKind: asNullableString(rec.rowKind),
        saleId: asString(rec.saleId),
        saleFolio: asString(rec.saleFolio),
        saleCreatedAtCdmx: asString(rec.saleCreatedAtCdmx),
        saleStatusName: asString(rec.saleStatusName),
        saleStatusCode: asString(rec.saleStatusCode),
        productName: asString(rec.productName),
        productImageFileId: asString(rec.productImageFileId),
        quantity: Number(rec.quantity) || 0,
        volumeM3: asString(rec.volumeM3),
        weightKg: asString(rec.weightKg),
        deliveryStatus: asString(rec.deliveryStatus),
        warehouseConfirmedAtCdmx: asNullableString(rec.warehouseConfirmedAtCdmx),
        warehouseConfirmedByWorkerId: asNullableString(rec.warehouseConfirmedByWorkerId),
        driverConfirmedAtCdmx: asNullableString(rec.driverConfirmedAtCdmx),
        driverConfirmedByWorkerId: asNullableString(rec.driverConfirmedByWorkerId),
        driverDeliveredAtCdmx: asNullableString(rec.driverDeliveredAtCdmx),
        driverDeliveredByWorkerId: asNullableString(rec.driverDeliveredByWorkerId),
        deliveryCompletionAtCdmx: asNullableString(rec.deliveryCompletionAtCdmx),
        deliverySignatureDataUrl: asNullableString(rec.deliverySignatureDataUrl),
        deliveryEvidenceFileIds: Array.isArray(rec.deliveryEvidenceFileIds)
          ? rec.deliveryEvidenceFileIds.map((id) => String(id).trim()).filter(Boolean)
          : [],
        transferId: asNullableString(rec.transferId),
        originWarehouseId: asString(rec.originWarehouseId),
        street: asString(rec.street),
        neighborhood: asString(rec.neighborhood),
        externalNumber: asString(rec.externalNumber),
        internalNumber: rec.internalNumber ?? null,
        zipCode: asString(rec.zipCode),
        city: asString(rec.city),
        state: asString(rec.state),
        country: asString(rec.country),
        latitude: Number(rec.latitude) || 0,
        longitude: Number(rec.longitude) || 0,
        mapSearchQuery: asString(rec.mapSearchQuery),
      })),
    })),
  };
}
