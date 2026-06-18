import { isDriverRouteHubVisible } from "../../domain/driverRouteHubVisibility";
import type { DriverAssignedRoutesReader } from "../../domain/driverAssignedRoutes/DriverAssignedRoutesReader";
import { fetchDriverAssignedRoutes } from "../../services/driverRoutesService";

const LIST_LIMIT = 50;

export function createApiDriverAssignedRoutesReader(): DriverAssignedRoutesReader {
  return {
    async fetchHubRoutes() {
      const { records } = await fetchDriverAssignedRoutes({
        limit: LIST_LIMIT,
        offset: 0,
        listMode: "map",
      });
      return records.filter(isDriverRouteHubVisible);
    },
  };
}
