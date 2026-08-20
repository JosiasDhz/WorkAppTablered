import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { getInAppUnreadCount } from "../services/inAppNotificationService";

type Listener = (count: number) => void;

let unreadCount = 0;
const listeners = new Set<Listener>();

export function getCachedInAppUnreadCount(): number {
  return unreadCount;
}

export function setCachedInAppUnreadCount(count: number): void {
  const next = Math.max(0, Math.floor(count));
  if (next === unreadCount) return;
  unreadCount = next;
  listeners.forEach((listener) => listener(unreadCount));
}

export function subscribeInAppUnreadCount(listener: Listener): () => void {
  listeners.add(listener);
  listener(unreadCount);
  return () => {
    listeners.delete(listener);
  };
}

export async function refreshInAppUnreadCount(): Promise<number> {
  try {
    const count = await getInAppUnreadCount();
    setCachedInAppUnreadCount(count);
    return count;
  } catch {
    return unreadCount;
  }
}

export function useInAppUnreadBadge(): number {
  const [count, setCount] = useState(unreadCount);

  useEffect(() => subscribeInAppUnreadCount(setCount), []);

  const sync = useCallback(() => {
    void refreshInAppUnreadCount();
  }, []);

  useEffect(() => {
    sync();
    const pushSub = Notifications.addNotificationReceivedListener(() => {
      sync();
    });
    const appSub = AppState.addEventListener("change", (next) => {
      if (next === "active") sync();
    });
    return () => {
      pushSub.remove();
      appSub.remove();
    };
  }, [sync]);

  return count;
}
