import type { DriverRouteAssignment } from "../../../domain/driverRouteAssignment/DriverRouteAssignmentReader";
import { createDriverRouteAssignmentReader } from "../../../infrastructure/driverRouteAssignment/createDriverRouteAssignmentReader";

const defaultReader = createDriverRouteAssignmentReader();

export async function loadDriverRouteMapAssignment(
  routeId: string,
): Promise<DriverRouteAssignment | null> {
  const trimmed = routeId.trim();
  if (!trimmed) return null;
  try {
    return await defaultReader.fetchAssignment(trimmed);
  } catch {
    return null;
  }
}
