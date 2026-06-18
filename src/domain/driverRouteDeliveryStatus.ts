import type { DriverRouteAssignment } from "./driverRouteAssignment/DriverRouteAssignmentReader";
import type { DriverAssignedRouteRecord } from "../services/driverRoutesService";

export function isListoParaEnvioDeliveryStatus(status: string): boolean {
  const normalized = String(status).trim().toUpperCase();
  return normalized === "LISTO_PARA_ENVIO" || normalized === "ASIGNADO_A_RUTA";
}

export function filterDriverRouteAssignmentListoParaEnvio(
  assignment: DriverRouteAssignment,
): DriverRouteAssignment {
  const destinations = assignment.destinations
    .map((dest) => ({
      ...dest,
      records: dest.records.filter((record) =>
        isListoParaEnvioDeliveryStatus(record.deliveryStatus),
      ),
    }))
    .filter((dest) => dest.records.length > 0);

  return { ...assignment, destinations };
}

export function isDriverAssignedRouteListVisible(
  route: DriverAssignedRouteRecord,
): boolean {
  return route.assignedDestinationsCount > 0 && route.assignedTotalUnits > 0;
}
