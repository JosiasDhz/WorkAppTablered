import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { useIsFocused } from "@react-navigation/native";
import {
  listInAppNotifications,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
  type InAppNotificationRow,
} from "../../services/inAppNotificationService";
import {
  countUnread,
  type NotificationGroup,
  type NotificationItem,
} from "./notificationTypes";
import { setCachedInAppUnreadCount } from "../../services/inAppUnreadBadge";

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatTimeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60_000));
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24 && startOfLocalDay(now) === startOfLocalDay(date)) {
    return `Hace ${diffHours} h`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (startOfLocalDay(yesterday) === startOfLocalDay(date)) return "Ayer";

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

function toItem(row: InAppNotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    timeLabel: formatTimeLabel(row.createdAt),
    read: Boolean(row.readAt),
  };
}

function groupItems(items: NotificationItem[], rows: InAppNotificationRow[]): NotificationGroup[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

  const today: NotificationItem[] = [];
  const week: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];

  for (const item of items) {
    const createdAt = byId.get(item.id)?.createdAt;
    const ts = createdAt ? new Date(createdAt).getTime() : NaN;
    if (!Number.isFinite(ts) || ts >= todayStart) {
      today.push(item);
      continue;
    }
    if (ts >= weekStart) {
      week.push(item);
      continue;
    }
    earlier.push(item);
  }

  const groups: NotificationGroup[] = [];
  if (today.length) groups.push({ id: "hoy", title: "Hoy", items: today });
  if (week.length) {
    groups.push({ id: "semana", title: "Esta semana", items: week });
  }
  if (earlier.length) {
    groups.push({ id: "anteriores", title: "Anteriores", items: earlier });
  }
  return groups;
}

export type InAppNotificationsController = {
  groups: NotificationGroup[];
  unreadCount: number;
  refreshing: boolean;
  loading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => Promise<void>;
};

export function useInAppNotifications(): InAppNotificationsController {
  const isFocused = useIsFocused();
  const [rows, setRows] = useState<InAppNotificationRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setRefreshing(true);
    try {
      const result = await listInAppNotifications({ limit: 50, offset: 0 });
      setRows(result.items);
    } catch {
      if (!opts?.silent) setRows([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    void load({ silent: true });
  }, [isFocused, load]);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      void load({ silent: true });
    });
    return () => sub.remove();
  }, [load]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active" && isFocused) {
        void load({ silent: true });
      }
    });
    return () => sub.remove();
  }, [isFocused, load]);

  const groups = useMemo(() => {
    const items = rows.map(toItem);
    return groupItems(items, rows);
  }, [rows]);

  const unreadCount = useMemo(() => countUnread(groups), [groups]);

  useEffect(() => {
    setCachedInAppUnreadCount(unreadCount);
  }, [unreadCount]);

  const markRead = useCallback((id: string) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id && !row.readAt
          ? { ...row, readAt: new Date().toISOString() }
          : row,
      ),
    );
    void markInAppNotificationRead(id).catch(() => {
      void load({ silent: true });
    });
  }, [load]);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    setRows((current) =>
      current.map((row) => (row.readAt ? row : { ...row, readAt: now })),
    );
    void markAllInAppNotificationsRead().catch(() => {
      void load({ silent: true });
    });
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return {
    groups,
    unreadCount,
    refreshing: refreshing || loading,
    loading,
    markRead,
    markAllRead,
    refresh,
  };
}
