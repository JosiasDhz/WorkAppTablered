import type { DriverRouteAssignmentDemo } from "../../pages/profile/driverDemo/driverRouteAssignmentDemo.types";

export type DriverRouteAssignment = DriverRouteAssignmentDemo;

export type DriverRouteAssignmentReader = {
  fetchAssignment: (routeId: string) => Promise<DriverRouteAssignment | null>;
};
