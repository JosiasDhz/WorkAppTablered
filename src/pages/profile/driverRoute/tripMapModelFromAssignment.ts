import type { LatLng } from "../../../maps/types";
import { decodeGoogleEncodedPolyline } from "../../../maps/decodeGoogleEncodedPolyline";
import type { DriverRouteAssignmentDemo } from "../driverDemo/driverRouteAssignmentDemo.types";
import { destinationsInRouteTravelOrder } from "./driverRouteDestinationsTravelOrder";
import { buildDriverRoutePinSvgDataUrl } from "./driverRouteMapPinIcon";

export type TripMapStopMarker = {
  latitude: number;
  longitude: number;
  color: string;
  visitOrder: number;
  label: string;
  iconUrl?: string;
};

export type TripMapOrigin = {
  latitude: number;
  longitude: number;
};

export type TripMapModel = {
  path: LatLng[];
  stops: TripMapStopMarker[];
  origin?: TripMapOrigin;
};

function firstPolylineEncoded(route: DriverRouteAssignmentDemo["route"]): string {
  const map = route.savedDirectionsPolylinesByVehicleId;
  if (!map || typeof map !== "object") return "";
  const values = Object.values(map);
  const first = values[0];
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

export function tripMapModelFromAssignment(
  assignment: DriverRouteAssignmentDemo,
): TripMapModel {
  const encoded = firstPolylineEncoded(assignment.route);
  let path = encoded ? decodeGoogleEncodedPolyline(encoded) : [];
  const sorted = destinationsInRouteTravelOrder(assignment);
  const stops: TripMapStopMarker[] = [];
  for (const dest of sorted) {
    const rec = dest.records[0];
    if (!rec) continue;
    const color = dest.pinColorHex || "#EA580C";
    stops.push({
      latitude: rec.latitude,
      longitude: rec.longitude,
      color,
      visitOrder: dest.visitOrder,
      label: formatStopLabel(dest),
      iconUrl: buildDriverRoutePinSvgDataUrl({
        fillColor: color,
        numberText: String(dest.visitOrder),
      }),
    });
  }
  if (path.length < 2 && stops.length >= 2) {
    path = stops.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    }));
  }
  return { path, stops };
}
