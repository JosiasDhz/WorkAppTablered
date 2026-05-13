import type { LatLng } from "../../../maps/types";
import { decodeGoogleEncodedPolyline } from "../../../maps/decodeGoogleEncodedPolyline";
import type {
  DriverRouteAssignmentDemo,
  DriverRouteAssignmentDemoDestination,
} from "../driverDemo/driverRouteAssignmentDemo.types";
import { sortedDriverRouteDestinations } from "./driverRouteSortDestinations";

function firstEncodedPolyline(route: DriverRouteAssignmentDemo["route"]): string {
  const map = route.savedDirectionsPolylinesByVehicleId;
  if (!map || typeof map !== "object") return "";
  const first = Object.values(map)[0];
  return typeof first === "string" ? first : "";
}

function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

function closestArcOnPath(path: LatLng[], lat: number, lng: number): { arc: number; distSq: number } {
  let acc = 0;
  let bestArc = 0;
  let bestDist = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const ax = a.latitude;
    const ay = a.longitude;
    const bx = b.latitude;
    const by = b.longitude;
    const abx = bx - ax;
    const aby = by - ay;
    const apx = lat - ax;
    const apy = lng - ay;
    const abLenSq = abx * abx + aby * aby;
    let t = 0;
    let cx = ax;
    let cy = ay;
    if (abLenSq >= 1e-22) {
      t = (apx * abx + apy * aby) / abLenSq;
      t = Math.max(0, Math.min(1, t));
      cx = ax + t * abx;
      cy = ay + t * aby;
    }
    const d = distSq(lat, lng, cx, cy);
    const segLen = Math.sqrt(abLenSq);
    const arc = acc + t * segLen;
    if (d < bestDist) {
      bestDist = d;
      bestArc = arc;
    }
    acc += segLen;
  }
  return { arc: bestArc, distSq: bestDist };
}

export function destinationsInRouteTravelOrder(
  assignment: DriverRouteAssignmentDemo,
): DriverRouteAssignmentDemoDestination[] {
  const enc = firstEncodedPolyline(assignment.route);
  const path = enc ? decodeGoogleEncodedPolyline(enc) : [];
  const dests = assignment.destinations;
  if (path.length < 2 || dests.length === 0) {
    return sortedDriverRouteDestinations(dests);
  }
  return [...dests]
    .map((d, i) => {
      const rec = d.records[0];
      if (!rec) {
        return { d, i, arc: Number.POSITIVE_INFINITY, distSq: Infinity };
      }
      const { arc, distSq } = closestArcOnPath(path, rec.latitude, rec.longitude);
      return { d, i, arc, distSq };
    })
    .sort((a, b) => {
      if (a.arc !== b.arc) return a.arc - b.arc;
      if (a.distSq !== b.distSq) return a.distSq - b.distSq;
      const aOk = typeof a.d.visitOrder === "number" && a.d.visitOrder > 0;
      const bOk = typeof b.d.visitOrder === "number" && b.d.visitOrder > 0;
      const av = aOk ? a.d.visitOrder : 1_000_000 + a.i;
      const bv = bOk ? b.d.visitOrder : 1_000_000 + b.i;
      if (av !== bv) return av - bv;
      return String(a.d.id).localeCompare(String(b.d.id));
    })
    .map((x) => x.d);
}
