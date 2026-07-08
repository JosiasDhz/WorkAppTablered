import type { DriverRouteAssignmentReader } from "../../domain/driverRouteAssignment/DriverRouteAssignmentReader";
import { DRIVER_ROUTE_ASSIGNMENT_DEMO } from "../../pages/profile/driverDemo/driverRouteAssignmentDemoPayload";
import type { DriverRouteAssignmentDemo } from "../../pages/profile/driverDemo/driverRouteAssignmentDemo.types";

export function createDemoDriverRouteAssignmentReader(): DriverRouteAssignmentReader {
  return {
    async fetchAssignment(routeId) {
      if (routeId !== DRIVER_ROUTE_ASSIGNMENT_DEMO.route.id) return null;
      return DRIVER_ROUTE_ASSIGNMENT_DEMO as DriverRouteAssignmentDemo;
    },
  };
}
