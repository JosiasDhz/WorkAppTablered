import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type {
  DriverRouteAssignment,
  DriverRouteAssignmentReader,
} from "../../../domain/driverRouteAssignment/DriverRouteAssignmentReader";
import { createDriverRouteAssignmentReader } from "../../../infrastructure/driverRouteAssignment/createDriverRouteAssignmentReader";

const defaultDriverRouteAssignmentReader = createDriverRouteAssignmentReader();

function extractErrorMessage(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === "string") return m;
    if (Array.isArray(m)) return m.map(String).join(", ");
  }
  return "No se pudo cargar el detalle de la ruta";
}

export type UseDriverRouteAssignmentDetailResult = {
  detail: DriverRouteAssignment | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useDriverRouteAssignmentDetail(
  routeId: string,
  reader: DriverRouteAssignmentReader = defaultDriverRouteAssignmentReader,
): UseDriverRouteAssignmentDetailResult {
  const readerRef = useRef(reader);
  readerRef.current = reader;

  const [detail, setDetail] = useState<DriverRouteAssignment | null>(null);
  const [loading, setLoading] = useState(Boolean(routeId.trim()));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const trimmed = routeId.trim();
    if (!trimmed) {
      setDetail(null);
      setError("Identificador de ruta no válido");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await readerRef.current.fetchAssignment(trimmed);
      setDetail(next);
      if (!next) {
        setError("No se encontró el detalle de esta ruta");
      }
    } catch (e: unknown) {
      setDetail(null);
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { detail, loading, error, refresh: load };
}
