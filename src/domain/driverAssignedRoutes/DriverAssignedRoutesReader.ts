import type { DriverAssignedRouteRecord } from "../../services/driverRoutesService";

export type DriverAssignedRoutesReader = {
  fetchHubRoutes: () => Promise<import("../../services/driverRoutesService").DriverAssignedRouteRecord[]>;
};
