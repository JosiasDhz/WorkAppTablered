import type { LatLng } from "../../../maps/types";
import { decodeGoogleEncodedPolyline } from "../../../maps/decodeGoogleEncodedPolyline";

export type NavDirectionsStep = {
  instructionText: string;
  endLat: number;
  endLng: number;
  maneuver: string | null;
};

type DirectionsJson = {
  status: string;
  routes?: {
    overview_polyline?: { points?: string };
    legs?: {
      distance?: { value: number };
      duration?: { value: number };
      steps?: {
        html_instructions?: string;
        end_location?: { lat: number; lng: number };
        maneuver?: string;
      }[];
    }[];
  }[];
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchDrivingDirections(
  apiKey: string,
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<{
  path: LatLng[];
  steps: NavDirectionsStep[];
  durationSec: number;
  distanceM: number;
} | null> {
  const key = apiKey.trim();
  if (!key) return null;
  const q = new URLSearchParams({
    origin: `${originLat},${originLng}`,
    destination: `${destLat},${destLng}`,
    mode: "driving",
    units: "metric",
    language: "es",
    key,
  });
  const url = `https://maps.googleapis.com/maps/api/directions/json?${q.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as DirectionsJson;
  if (data.status !== "OK" || !data.routes?.[0]) return null;
  const route = data.routes[0];
  const enc = route.overview_polyline?.points;
  const path = enc ? decodeGoogleEncodedPolyline(enc) : [];
  const leg = route.legs?.[0];
  const stepsRaw = leg?.steps ?? [];
  const steps: NavDirectionsStep[] = stepsRaw.map((s) => ({
    instructionText: stripHtml(s.html_instructions ?? ""),
    endLat: s.end_location?.lat ?? destLat,
    endLng: s.end_location?.lng ?? destLng,
    maneuver: typeof s.maneuver === "string" && s.maneuver.length > 0 ? s.maneuver : null,
  }));
  return {
    path,
    steps,
    durationSec: leg?.duration?.value ?? 0,
    distanceM: leg?.distance?.value ?? 0,
  };
}
