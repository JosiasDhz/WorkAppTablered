import { useEffect, useRef, useSyncExternalStore } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store/store";
import {
  connectRealtime,
  disconnectRealtime,
  isRealtimeConnected,
  subscribeRealtime,
  subscribeRealtimeConnection,
} from "./realtimeClient";

export function useRealtimeSession(): void {
  const token = useSelector((state: RootState) => state.auth.token);
  const userId = useSelector(
    (state: RootState) => (state.auth.user?.id as string | undefined) ?? null,
  );

  useEffect(() => {
    if (!token || !userId) {
      disconnectRealtime();
      return;
    }
    connectRealtime(userId);
  }, [token, userId]);
}

export function useRealtimeConnected(): boolean {
  return useSyncExternalStore(subscribeRealtimeConnection, isRealtimeConnected);
}

export function useRealtimeEvent(
  types: readonly string[],
  handler: (data: unknown) => void,
  enabled = true,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const typesKey = types.join("|");

  useEffect(() => {
    if (!enabled) return;
    const unsubscribers = typesKey
      .split("|")
      .filter(Boolean)
      .map((type) => subscribeRealtime(type, (data) => handlerRef.current(data)));
    return () => {
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }, [typesKey, enabled]);
}
