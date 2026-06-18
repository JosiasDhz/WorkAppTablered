import type { DriverRouteAssignment } from "../../domain/driverRouteAssignment/DriverRouteAssignmentReader";
import { filterDriverRouteAssignmentListoParaEnvio } from "../../domain/driverRouteDeliveryStatus";
import { fetchSavedDeliveryRouteDetail } from "../../services/deliveryRoutesService";
import { normalizeDriverRouteAssignmentFromApi } from "./normalizeDriverRouteAssignmentFromApi";

export function createApiDriverRouteAssignmentReader(): DriverRouteAssignmentReader {
  return {
    async fetchAssignment(routeId) {
      const trimmed = routeId.trim();
      if (!trimmed) return null;
      const raw = await fetchSavedDeliveryRouteDetail(trimmed);
      const normalized = normalizeDriverRouteAssignmentFromApi(raw);
      const filtered = filterDriverRouteAssignmentListoParaEnvio(normalized);
      if (filtered.destinations.length === 0) return null;
      return filtered;
    },
  };
}
