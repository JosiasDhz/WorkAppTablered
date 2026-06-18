import type { DriverRouteAssignmentReader } from "../../domain/driverRouteAssignment/DriverRouteAssignmentReader";
import { filterDriverRouteAssignmentListoParaEnvio } from "../../domain/driverRouteDeliveryStatus";
import { DRIVER_ROUTE_ASSIGNMENT_DEMO } from "../../pages/profile/driverDemo/driverRouteAssignmentDemoPayload";
import type { DriverRouteAssignmentDemo } from "../../pages/profile/driverDemo/driverRouteAssignmentDemo.types";

export function createDemoDriverRouteAssignmentReader(): DriverRouteAssignmentReader {
  return {
    async fetchAssignment(routeId) {
      if (routeId !== DRIVER_ROUTE_ASSIGNMENT_DEMO.route.id) return null;
      const filtered = filterDriverRouteAssignmentListoParaEnvio(
        DRIVER_ROUTE_ASSIGNMENT_DEMO as DriverRouteAssignmentDemo,
      );
      if (filtered.destinations.length === 0) return null;
      return filtered;
    },
  };
}
