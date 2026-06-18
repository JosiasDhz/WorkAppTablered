import type { DriverRouteAssignmentReader } from "../../domain/driverRouteAssignment/DriverRouteAssignmentReader";
import { DRIVER_ROUTES_DETAIL_USE_DEMO } from "../../pages/profile/driverDemo/driverRoutesListDemoFlag";
import { createApiDriverRouteAssignmentReader } from "./apiDriverRouteAssignmentReader";
import { createDemoDriverRouteAssignmentReader } from "./demoDriverRouteAssignmentReader";

export function createDriverRouteAssignmentReader(): DriverRouteAssignmentReader {
  if (DRIVER_ROUTES_DETAIL_USE_DEMO) {
    return createDemoDriverRouteAssignmentReader();
  }
  return createApiDriverRouteAssignmentReader();
}
