import type { DriverRouteAssignmentDemoDestination } from "../driverDemo/driverRouteAssignmentDemo.types";

export function sortedDriverRouteDestinations(
  destinations: DriverRouteAssignmentDemoDestination[],
): DriverRouteAssignmentDemoDestination[] {
  return [...destinations]
    .map((d, i) => ({ d, i }))
    .sort((a, b) => {
      const aOk = typeof a.d.visitOrder === "number" && a.d.visitOrder > 0;
      const bOk = typeof b.d.visitOrder === "number" && b.d.visitOrder > 0;
      const av = aOk ? a.d.visitOrder : 1_000_000 + a.i;
      const bv = bOk ? b.d.visitOrder : 1_000_000 + b.i;
      if (av !== bv) return av - bv;
      return String(a.d.id).localeCompare(String(b.d.id));
    })
    .map((x) => x.d);
}
