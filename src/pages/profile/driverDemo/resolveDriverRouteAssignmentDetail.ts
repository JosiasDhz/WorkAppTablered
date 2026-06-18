import { DRIVER_ROUTES_FLOW_USE_DEMO } from "./driverRoutesListDemoFlag";
import { DRIVER_ROUTE_ASSIGNMENT_DEMO } from "./driverRouteAssignmentDemoPayload";
import type { DriverRouteAssignmentDemo } from "./driverRouteAssignmentDemo.types";

export function getDriverRouteAssignmentDetail(
  routeId: string,
): DriverRouteAssignmentDemo | null {
  if (!DRIVER_ROUTES_FLOW_USE_DEMO) return null;
  if (routeId !== DRIVER_ROUTE_ASSIGNMENT_DEMO.route.id) return null;
  return DRIVER_ROUTE_ASSIGNMENT_DEMO;
}
