import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { openInAppNotificationDetail } from "../../navigation/navigationRef";
import {
  consumePendingNotificationOpen,
  markPendingNotificationOpen,
} from "./pendingNotificationOpen";

function resolveNotificationId(
  data: Record<string, unknown> | undefined,
): string | null {
  if (!data) return null;
  const raw =
    data.notificationId ?? data.id ?? data.notification_id ?? data.inAppId;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return null;
}

function queueOrOpenFromData(
  data: Record<string, unknown> | undefined,
  canOpenNow: boolean,
): void {
  const notificationId = resolveNotificationId(data);
  if (!notificationId) return;

  const payload = {
    notificationId,
    title: typeof data?.title === "string" ? data.title : undefined,
    body: typeof data?.body === "string" ? data.body : undefined,
    type: typeof data?.type === "string" ? data.type : undefined,
  };

  if (canOpenNow) {
    openInAppNotificationDetail(payload);
    return;
  }

  markPendingNotificationOpen(payload);
}

export function useOpenNotificationFromPush(isAuthenticated: boolean) {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        queueOrOpenFromData(data, isAuthenticated);
      },
    );

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      queueOrOpenFromData(data, isAuthenticated);
      void Notifications.clearLastNotificationResponseAsync();
    });

    return () => sub.remove();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const pending = consumePendingNotificationOpen();
    if (!pending) return;
    const timer = setTimeout(() => {
      openInAppNotificationDetail(pending);
    }, 350);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);
}
