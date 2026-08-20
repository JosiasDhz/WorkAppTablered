import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import http from "../api/http-common";

export const TABLERED_PUSH_CHANNEL_ID = "tablered";
export const TABLERED_PUSH_SOUND = "tablered_notice.wav";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function resolveExpoProjectId(): string | undefined {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId
  );
}

export async function ensureTableredPushChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(TABLERED_PUSH_CHANNEL_ID, {
    name: "Avisos Table Red",
    description: "Notificaciones de Table Red",
    importance: Notifications.AndroidImportance.HIGH,
    sound: TABLERED_PUSH_SOUND,
    vibrationPattern: [0, 180, 90, 180],
    lightColor: "#EA7600",
    enableVibrate: true,
  });
}

export async function getExpoPushTokenAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  await ensureTableredPushChannel();

  const projectId = resolveExpoProjectId();
  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  const token = tokenResponse?.data?.trim();
  if (!token?.startsWith("ExponentPushToken[")) return null;
  return token;
}

export async function registerExpoPushTokenWithApi(): Promise<string | null> {
  try {
    const token = await getExpoPushTokenAsync();
    if (!token) return null;
    await http.patch("/push-notifications/me/token", { token });
    return token;
  } catch {
    return null;
  }
}
