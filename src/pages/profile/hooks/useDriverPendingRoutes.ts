import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  fetchDriverAssignedRoutes,
  type DriverAssignedRouteRecord,
} from "../../../services/driverRoutesService";
import { isPendingDriverRouteStatus } from "../../../domain/driverRoutePending";
import { DRIVER_ROUTES_LIST_USE_DEMO } from "../driverDemo/driverRoutesListDemoFlag";
import { DRIVER_ROUTE_ASSIGNMENT_DEMO } from "../driverDemo/driverRouteAssignmentDemoPayload";
import { mapDriverRouteAssignmentDemoToListRecord } from "../driverDemo/mapDriverRouteAssignmentDemoToListRecord";

const LIST_LIMIT = 50;

function extractErrorMessage(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === "string") return m;
    if (Array.isArray(m)) return m.map(String).join(", ");
  }
  return "No se pudieron cargar las rutas";
}

export type UseDriverPendingRoutesResult = {
  items: DriverAssignedRouteRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useDriverPendingRoutes(
  enabled: boolean,
): UseDriverPendingRoutesResult {
  const [items, setItems] = useState<DriverAssignedRouteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      if (DRIVER_ROUTES_LIST_USE_DEMO) {
        const row = mapDriverRouteAssignmentDemoToListRecord(DRIVER_ROUTE_ASSIGNMENT_DEMO);
        setItems(isPendingDriverRouteStatus(row.status) ? [row] : []);
        return;
      }
      const { records } = await fetchDriverAssignedRoutes({
        limit: LIST_LIMIT,
        offset: 0,
      });
      setItems(records.filter((r) => isPendingDriverRouteStatus(r.status)));
    } catch (e: unknown) {
      setError(extractErrorMessage(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { items, loading, error, refresh: load };
}
