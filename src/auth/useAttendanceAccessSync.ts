import { useEffect } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store/store";
import { refreshAuthSession } from "../services/refreshAuthSession";
import { REALTIME_EVENTS } from "../services/realtime/realtimeClient";
import { useRealtimeEvent } from "../services/realtime/useRealtime";
import { ATTENDANCE_ACCESS_PUSH_TYPES } from "./attendanceAccess";

const MAX_TIMER_MS = 2_147_000_000;
const ACCESS_REALTIME_EVENTS = [REALTIME_EVENTS.attendanceAccessChanged] as const;

function isAttendanceAccessPush(
  notification: Notifications.Notification,
): boolean {
  const type = (
    notification.request.content.data as Record<string, unknown> | undefined
  )?.type;
  return typeof type === "string" && ATTENDANCE_ACCESS_PUSH_TYPES.has(type);
}

export function useAttendanceAccessSync(): void {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const { blocked, restrictsAt } = useSelector(
    (state: RootState) => state.attendanceAccess,
  );

  useRealtimeEvent(
    ACCESS_REALTIME_EVENTS,
    () => {
      refreshAuthSession(dispatch).catch(() => {});
    },
    Boolean(token),
  );

  useEffect(() => {
    if (!token) return;
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      if (!isAttendanceAccessPush(notification)) return;
      refreshAuthSession(dispatch).catch(() => {});
    });
    return () => sub.remove();
  }, [token, dispatch]);

  useEffect(() => {
    if (!token || blocked || !restrictsAt) return;
    const delay = new Date(restrictsAt).getTime() - Date.now() + 1_000;
    if (!Number.isFinite(delay) || delay > MAX_TIMER_MS) return;
    const id = setTimeout(
      () => {
        refreshAuthSession(dispatch).catch(() => {});
      },
      Math.max(delay, 0),
    );
    return () => clearTimeout(id);
  }, [token, blocked, restrictsAt, dispatch]);

  useEffect(() => {
    if (!token || !blocked) return;
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      refreshAuthSession(dispatch).catch(() => {});
    });
    return () => sub.remove();
  }, [token, blocked, dispatch]);
}
