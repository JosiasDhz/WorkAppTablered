import type { DriverRouteAssignmentReader } from "../../domain/driverRouteAssignment/DriverRouteAssignmentReader";
import { fetchSavedDeliveryRouteDetail } from "../../services/deliveryRoutesService";
import { normalizeDriverRouteAssignmentFromApi } from "./normalizeDriverRouteAssignmentFromApi";

export function createApiDriverRouteAssignmentReader(): DriverRouteAssignmentReader {
  return {
    async fetchAssignment(routeId) {
      const trimmed = routeId.trim();
      if (!trimmed) return null;
      const raw = await fetchSavedDeliveryRouteDetail(trimmed);
      return normalizeDriverRouteAssignmentFromApi(raw);
    },
  };
}
