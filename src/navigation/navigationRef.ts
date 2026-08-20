import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "../routes/RootStackParamList";

export const navigationRef =
  createNavigationContainerRef<RootStackParamList>();

export function openInAppNotificationDetail(input: {
  notificationId: string;
  title?: string;
  body?: string;
  type?: string;
}): void {
  const id = input.notificationId?.trim();
  if (!id || !navigationRef.isReady()) return;

  navigationRef.navigate("Tabs", {
    screen: "NotificationsStack",
    params: {
      screen: "NotificationDetail",
      params: {
        notificationId: id,
        title: input.title,
        body: input.body,
        type: input.type,
      },
    },
  });
}
