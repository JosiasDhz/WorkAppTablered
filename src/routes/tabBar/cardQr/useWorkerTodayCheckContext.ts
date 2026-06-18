import { useCallback, useEffect, useState } from "react";
import {
  fetchWorkerTodayCheckContext,
  type WorkerTodayCheckContext,
} from "../../../services/attendanceService";

export function useWorkerTodayCheckContext(active: boolean) {
  const [context, setContext] = useState<WorkerTodayCheckContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWorkerTodayCheckContext();
      setContext(data);
    } catch {
      setError("No se pudo cargar tu jornada de hoy");
      setContext(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    void reload();
  }, [active, reload]);

  return { context, loading, error, reload };
}
