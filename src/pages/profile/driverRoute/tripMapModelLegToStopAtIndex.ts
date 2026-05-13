import type { LatLng } from "../../../maps/types";
import { decodeGoogleEncodedPolyline } from "../../../maps/decodeGoogleEncodedPolyline";
import type { DriverRouteAssignmentDemo } from "../driverDemo/driverRouteAssignmentDemo.types";
import { destinationsInRouteTravelOrder } from "./driverRouteDestinationsTravelOrder";
import { slicePolylineTowardPoint } from "./slicePolylineTowardPoint";
import type { TripMapModel, TripMapStopMarker } from "./tripMapModelFromAssignment";

function firstEncodedPolyline(route: DriverRouteAssignmentDemo["route"]): string {
  const map = route.savedDirectionsPolylinesByVehicleId;
  if (!map || typeof map !== "object") return "";
  const first = Object.values(map)[0];
  return typeof first === "string" ? first : "";
}

function formatStopLabel(
  dest: DriverRouteAssignmentDemo["destinations"][0],
): string {
  const rec = dest.records[0];
  if (!rec) return `Parada ${dest.visitOrder}`;
  const parts = [
    rec.street,
    rec.externalNumber,
    rec.neighborhood,
    rec.zipCode,
    rec.city,
  ].filter(Boolean);
  return parts.join(", ") || rec.mapSearchQuery || `Parada ${dest.visitOrder}`;
}

export function tripMapModelLegToStopAtIndex(
  assignment: DriverRouteAssignmentDemo,
  stopIndex: number,
): TripMapModel {
  const encoded = firstEncodedPolyline(assignment.route);
  const pathFull: LatLng[] = encoded ? decodeGoogleEncodedPolyline(encoded) : [];
  const sorted = destinationsInRouteTravelOrder(assignment);
  const dest = sorted[Math.max(0, Math.min(stopIndex, sorted.length - 1))];
  const rec = dest?.records[0];
  if (!rec) {
    return { path: [], stops: [] };
  }
  let pathLeg = pathFull;
  if (pathFull.length >= 2) {
    pathLeg = slicePolylineTowardPoint(pathFull, rec.latitude, rec.longitude);
  }
  const stops: TripMapStopMarker[] = [
    {
      latitude: rec.latitude,
      longitude: rec.longitude,
      color: dest.pinColorHex || "#EA7600",
      visitOrder: dest.visitOrder,
      label: formatStopLabel(dest),
    },
  ];
  return { path: pathLeg, stops };
}
