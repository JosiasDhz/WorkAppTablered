import { useEffect, useState } from "react";
import * as Location from "expo-location";
import type { LatLng } from "../../../maps/types";
import { fetchDrivingDirections } from "./fetchDrivingDirections";
import type { TripMapModel, TripMapStopMarker } from "./tripMapModelFromAssignment";

export function useStaticLegRouteMap(
  apiKey: string,
  stop: TripMapStopMarker | null,
  fallbackPath: LatLng[],
  enabled: boolean,
  fallbackRevision = 0,
): {
  loading: boolean;
  permissionDenied: boolean;
  directionsFailed: boolean;
  model: TripMapModel;
} {
  const [loading, setLoading] = useState(enabled);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [directionsFailed, setDirectionsFailed] = useState(false);
  const [model, setModel] = useState<TripMapModel>({
    path: fallbackPath,
    stops: stop ? [stop] : [],
  });

  useEffect(() => {
    if (!enabled || !stop) {
      setLoading(false);
      setModel({ path: fallbackPath, stops: stop ? [stop] : [] });
      return;
    }

    let alive = true;
    setLoading(true);
    setPermissionDenied(false);
    setDirectionsFailed(false);

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!alive) return;
      if (status !== Location.PermissionStatus.GRANTED) {
        setPermissionDenied(true);
        setModel({ path: fallbackPath, stops: [stop] });
        setLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!alive) return;

      const oLat = pos.coords.latitude;
      const oLng = pos.coords.longitude;
      const dir = await fetchDrivingDirections(
        apiKey,
        oLat,
        oLng,
        stop.latitude,
        stop.longitude,
      );
      if (!alive) return;

      const path = dir && dir.path.length >= 2 ? dir.path : fallbackPath;
      setDirectionsFailed(!dir || dir.path.length < 2);
      setModel({
        path,
        stops: [stop],
        origin: { latitude: oLat, longitude: oLng },
      });
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [apiKey, enabled, fallbackRevision, stop?.latitude, stop?.longitude, stop?.visitOrder, stop?.label]);

  return { loading, permissionDenied, directionsFailed, model };
}
