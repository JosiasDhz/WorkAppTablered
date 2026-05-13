import { useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import type { LatLng } from "../../../maps/types";
import { fetchDrivingDirections, type NavDirectionsStep } from "./fetchDrivingDirections";
import { bearingDeg, haversineMeters } from "./haversineMeters";
import { resolveNavTurnKind, type NavTurnKind } from "./resolveNavTurnKind";

const STEP_END_RADIUS_M = 42;
const ARRIVED_RADIUS_M = 55;
const AVG_SPEED_MPS = 7;

export type LiveLegNavigationState = {
  permissionDenied: boolean;
  loadingDirections: boolean;
  directionsFailed: boolean;
  legPath: LatLng[];
  steps: NavDirectionsStep[];
  stepIndex: number;
  userLat: number | null;
  userLng: number | null;
  headingDeg: number | null;
  destLat: number;
  destLng: number;
  totalDurationSec: number;
  totalDistanceM: number;
  navTurnKind: NavTurnKind;
};

function formatMeters(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

export function useLiveLegNavigation(
  apiKey: string,
  destLat: number,
  destLng: number,
  fallbackPath: LatLng[],
): LiveLegNavigationState & {
  primaryLine: string;
  secondaryLine: string;
  progressLine: string;
  arrived: boolean;
  effectivePath: LatLng[];
} {
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loadingDirections, setLoadingDirections] = useState(true);
  const [directionsFailed, setDirectionsFailed] = useState(false);
  const [legPath, setLegPath] = useState<LatLng[]>([]);
  const [steps, setSteps] = useState<NavDirectionsStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [headingDeg, setHeadingDeg] = useState<number | null>(null);
  const [totalDurationSec, setTotalDurationSec] = useState(0);
  const [totalDistanceM, setTotalDistanceM] = useState(0);

  const prevPos = useRef<{ lat: number; lng: number } | null>(null);
  const stepsRef = useRef<NavDirectionsStep[]>([]);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const effectivePath = legPath.length >= 2 ? legPath : fallbackPath;

  useEffect(() => {
    let alive = true;
    const subRef = { current: null as Location.LocationSubscription | null };

    if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) {
      setLoadingDirections(false);
      setPermissionDenied(false);
      setDirectionsFailed(false);
      return () => {
        alive = false;
      };
    }

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!alive) return;
      if (status !== Location.PermissionStatus.GRANTED) {
        setPermissionDenied(true);
        setLoadingDirections(false);
        setDirectionsFailed(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      if (!alive) return;
      const oLat = pos.coords.latitude;
      const oLng = pos.coords.longitude;
      setUserLat(oLat);
      setUserLng(oLng);
      if (typeof pos.coords.heading === "number" && pos.coords.heading >= 0) {
        setHeadingDeg(pos.coords.heading);
      }

      const dir = await fetchDrivingDirections(apiKey, oLat, oLng, destLat, destLng);
      if (!alive) return;
      if (dir && dir.path.length >= 2) {
        setLegPath(dir.path);
        setSteps(dir.steps);
        stepsRef.current = dir.steps;
        setStepIndex(0);
        setTotalDurationSec(dir.durationSec);
        setTotalDistanceM(dir.distanceM);
        setDirectionsFailed(false);
      } else {
        setDirectionsFailed(true);
      }
      setLoadingDirections(false);

      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 650,
          distanceInterval: 5,
        },
        (loc) => {
          if (!alive) return;
          const la = loc.coords.latitude;
          const ln = loc.coords.longitude;
          setUserLat(la);
          setUserLng(ln);
          let h: number | null =
            typeof loc.coords.heading === "number" && loc.coords.heading >= 0
              ? loc.coords.heading
              : null;
          const prev = prevPos.current;
          if (h == null && prev) {
            h = bearingDeg(prev.lat, prev.lng, la, ln);
          }
          prevPos.current = { lat: la, lng: ln };
          setHeadingDeg(h);

          setStepIndex((cur) => {
            const arr = stepsRef.current;
            if (arr.length === 0) return cur;
            const idx = Math.min(cur, arr.length - 1);
            const s = arr[idx];
            if (!s) return cur;
            const dEnd = haversineMeters(la, ln, s.endLat, s.endLng);
            if (dEnd < STEP_END_RADIUS_M && cur < arr.length - 1) return cur + 1;
            return cur;
          });
        },
      );
    })();

    return () => {
      alive = false;
      subRef.current?.remove();
    };
  }, [apiKey, destLat, destLng]);

  const arrived = useMemo(() => {
    if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) return false;
    if (userLat == null || userLng == null) return false;
    return haversineMeters(userLat, userLng, destLat, destLng) < ARRIVED_RADIUS_M;
  }, [userLat, userLng, destLat, destLng]);

  const distToStepEndM = useMemo(() => {
    if (userLat == null || userLng == null || steps.length === 0) return 0;
    const s = steps[Math.min(stepIndex, steps.length - 1)];
    if (!s) return 0;
    return haversineMeters(userLat, userLng, s.endLat, s.endLng);
  }, [userLat, userLng, steps, stepIndex]);

  const distToDestM = useMemo(() => {
    if (userLat == null || userLng == null) return totalDistanceM;
    return haversineMeters(userLat, userLng, destLat, destLng);
  }, [userLat, userLng, destLat, destLng, totalDistanceM]);

  const etaMinApprox = useMemo(() => {
    if (distToDestM <= 0) return 0;
    return Math.max(1, Math.round(distToDestM / (AVG_SPEED_MPS * 60)));
  }, [distToDestM]);

  const primaryLine = useMemo(() => {
    if (arrived) return "Has llegado";
    if (steps.length === 0) return "Sigue la ruta hacia la parada";
    const s = steps[Math.min(stepIndex, steps.length - 1)];
    return s?.instructionText || "Continúa";
  }, [steps, stepIndex, arrived]);

  const secondaryLine = useMemo(() => {
    if (arrived) return "Parada alcanzada";
    if (steps.length === 0) return formatMeters(distToDestM);
    return formatMeters(distToStepEndM);
  }, [arrived, steps.length, distToDestM, distToStepEndM]);

  const progressLine = useMemo(() => {
    if (totalDistanceM > 0 && distToDestM >= 0) {
      const remain = Math.min(totalDistanceM, Math.max(0, distToDestM));
      const dMin = totalDurationSec > 0 ? Math.ceil(totalDurationSec / 60) : etaMinApprox;
      return `${formatMeters(remain)} · ~${dMin} min`;
    }
    return `${formatMeters(distToDestM)} · ~${etaMinApprox} min`;
  }, [totalDistanceM, distToDestM, totalDurationSec, etaMinApprox]);

  const navTurnKind = useMemo((): NavTurnKind => {
    if (arrived) return "unknown";
    const idx = steps.length === 0 ? -1 : Math.min(stepIndex, steps.length - 1);
    const m = idx >= 0 ? (steps[idx]?.maneuver ?? null) : null;
    return resolveNavTurnKind(m, primaryLine);
  }, [arrived, steps, stepIndex, primaryLine]);

  return {
    permissionDenied,
    loadingDirections,
    directionsFailed,
    legPath,
    steps,
    stepIndex,
    userLat,
    userLng,
    headingDeg,
    destLat,
    destLng,
    totalDurationSec,
    totalDistanceM,
    primaryLine,
    secondaryLine,
    progressLine,
    arrived,
    effectivePath,
    navTurnKind,
  };
}
