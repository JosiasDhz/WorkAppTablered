import type { DriverAssignedRoutesReader } from "../../domain/driverAssignedRoutes/DriverAssignedRoutesReader";
import { DRIVER_ROUTES_ASSIGNED_LIST_USE_DEMO } from "../../pages/profile/driverDemo/driverRoutesListDemoFlag";
import { createApiDriverAssignedRoutesReader } from "./apiDriverAssignedRoutesReader";
import { createDemoDriverAssignedRoutesReader } from "./demoDriverAssignedRoutesReader";

export function createDriverAssignedRoutesReader(): DriverAssignedRoutesReader {
  if (DRIVER_ROUTES_ASSIGNED_LIST_USE_DEMO) {
    return createDemoDriverAssignedRoutesReader();
  }
  return createApiDriverAssignedRoutesReader();
}
