import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { DriverAssignedRoutesReader } from "../../../domain/driverAssignedRoutes/DriverAssignedRoutesReader";
import { createDriverAssignedRoutesReader } from "../../../infrastructure/driverAssignedRoutes/createDriverAssignedRoutesReader";
import type { DriverAssignedRouteRecord } from "../../../services/driverRoutesService";

const defaultDriverAssignedRoutesReader = createDriverAssignedRoutesReader();

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
  reader: DriverAssignedRoutesReader = defaultDriverAssignedRoutesReader,
): UseDriverPendingRoutesResult {
  const readerRef = useRef(reader);
  readerRef.current = reader;

  const [items, setItems] = useState<DriverAssignedRouteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await readerRef.current.fetchHubRoutes());
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
