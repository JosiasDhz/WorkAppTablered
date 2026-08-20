import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getDriverRouteMyCommission } from "../../../services/deliveryRoutesService";

export type DriverRouteCommissionState = {
  earnedMxn: number;
  pendingMxn: number;
  loading: boolean;
};

export function useDriverRouteMyCommission(
  routeId: string,
  enabled: boolean,
): DriverRouteCommissionState {
  const [earnedMxn, setEarnedMxn] = useState(0);
  const [pendingMxn, setPendingMxn] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const trimmed = routeId.trim();
    if (!enabled || !trimmed) {
      setEarnedMxn(0);
      setPendingMxn(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const next = await getDriverRouteMyCommission(trimmed);
      setEarnedMxn(Math.max(0, Number(next.commissionEarnedMxn) || 0));
      setPendingMxn(Math.max(0, Number(next.commissionPendingPaymentMxn) || 0));
    } catch {
      setEarnedMxn(0);
      setPendingMxn(0);
    } finally {
      setLoading(false);
    }
  }, [enabled, routeId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { earnedMxn, pendingMxn, loading };
}
