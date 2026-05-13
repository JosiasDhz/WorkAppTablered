import type { LatLng } from "../../../maps/types";

export function slicePolylineTowardPoint(path: LatLng[], lat: number, lng: number): LatLng[] {
  if (path.length <= 1) return [...path];
  let bestI = 0;
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
    if (abLenSq >= 1e-22) {
      t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
    }
    const cx = ax + t * abx;
    const cy = ay + t * aby;
    const d = (lat - cx) * (lat - cx) + (lng - cy) * (lng - cy);
    if (d < bestDist) {
      bestDist = d;
      bestI = i;
    }
  }
  return path.slice(0, Math.min(path.length, bestI + 2));
}
