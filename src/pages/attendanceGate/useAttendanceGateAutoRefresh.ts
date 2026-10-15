import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../redux/store/store";
import { refreshAuthSession } from "../../services/refreshAuthSession";
import { useRealtimeConnected } from "../../services/realtime/useRealtime";

const FALLBACK_POLL_MS = 60_000;
const AFTER_CHECK_DELAY_MS = 1_500;

export function useAttendanceGateAutoRefresh(active: boolean, checkEvent: unknown) {
  const dispatch = useDispatch<AppDispatch>();
  const realtimeConnected = useRealtimeConnected();

  useEffect(() => {
    if (!active || realtimeConnected) return;
    const id = setInterval(() => {
      refreshAuthSession(dispatch).catch(() => {});
    }, FALLBACK_POLL_MS);
    return () => clearInterval(id);
  }, [active, realtimeConnected, dispatch]);

  useEffect(() => {
    if (!checkEvent) return;
    const id = setTimeout(() => {
      refreshAuthSession(dispatch).catch(() => {});
    }, AFTER_CHECK_DELAY_MS);
    return () => clearTimeout(id);
  }, [checkEvent, dispatch]);
}
