import type {
  DriverRouteAssignmentDemo,
  DriverRouteAssignmentDemoDestination,
  DriverRouteAssignmentDemoRecord,
} from "../driverDemo/driverRouteAssignmentDemo.types";
import { sortedDriverRouteDestinations } from "./driverRouteSortDestinations";

export type PickupLineView = {
  recordId: string;
  destinationId: string;
  visitOrder: number;
  stopTitle: string;
  productName: string;
  saleFolio: string;
  expectedQty: number;
};

function formatStopTitle(
  dest: DriverRouteAssignmentDemoDestination,
  rec: DriverRouteAssignmentDemoRecord,
): string {
  const addr = [rec.street, rec.externalNumber, rec.neighborhood, rec.city]
    .filter(Boolean)
    .join(", ");
  return `Parada ${dest.visitOrder}${addr ? ` · ${addr}` : ""}`;
}

export function buildPickupLinesLifoFromAssignment(
  assignment: DriverRouteAssignmentDemo,
): PickupLineView[] {
  const deliveryOrder = sortedDriverRouteDestinations(assignment.destinations);
  const loadOrder = [...deliveryOrder].reverse();
  const out: PickupLineView[] = [];
  for (const dest of loadOrder) {
    for (const rec of dest.records) {
      out.push({
        recordId: rec.id,
        destinationId: dest.id,
        visitOrder: dest.visitOrder,
        stopTitle: formatStopTitle(dest, rec),
        productName: rec.productName,
        saleFolio: rec.saleFolio,
        expectedQty: rec.quantity,
      });
    }
  }
  return out;
}

export function groupPickupLinesByDestinationInOrder(
  lines: PickupLineView[],
): {
  destinationId: string;
  visitOrder: number;
  loadSequence: number;
  stopTitle: string;
  lines: PickupLineView[];
}[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const line of lines) {
    if (!seen.has(line.destinationId)) {
      seen.add(line.destinationId);
      order.push(line.destinationId);
    }
  }
  const byDest = new Map<string, PickupLineView[]>();
  for (const line of lines) {
    const arr = byDest.get(line.destinationId) ?? [];
    arr.push(line);
    byDest.set(line.destinationId, arr);
  }
  return order.map((destinationId, index) => {
    const first = byDest.get(destinationId)![0];
    return {
      destinationId,
      visitOrder: first.visitOrder,
      loadSequence: index + 1,
      stopTitle: first.stopTitle,
      lines: byDest.get(destinationId)!,
    };
  });
}
