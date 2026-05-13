import type { DriverRouteAssignmentDemo } from "../driverDemo/driverRouteAssignmentDemo.types";
import type { TripMapModel } from "./tripMapModelFromAssignment";
import { tripMapModelLegToStopAtIndex } from "./tripMapModelLegToStopAtIndex";

export function tripMapModelLegToFirstStop(assignment: DriverRouteAssignmentDemo): TripMapModel {
  return tripMapModelLegToStopAtIndex(assignment, 0);
}
