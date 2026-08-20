import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  getWorkerHomeKpis,
  type WorkerHomeKpis,
} from "../../../services/workerKpisService";

export type WorkerHomeKpisState = {
  data: WorkerHomeKpis | null;
  loading: boolean;
};

export function useWorkerHomeKpis(): WorkerHomeKpisState {
  const [data, setData] = useState<WorkerHomeKpis | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const next = await getWorkerHomeKpis();
      setData(next);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { data, loading };
}
