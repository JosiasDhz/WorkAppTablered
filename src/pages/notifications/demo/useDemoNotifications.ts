import { useCallback, useMemo, useState } from "react";
import demoSource from "./notificationsDemo.json";
import {
  countUnread,
  type NotificationGroup,
} from "../notificationTypes";

function cloneDemoGroups(): NotificationGroup[] {
  return demoSource.groups.map((group) => ({
    ...group,
    items: group.items.map((item) => ({ ...item })),
  }));
}

function markItems(
  groups: NotificationGroup[],
  shouldMark: (id: string) => boolean,
): NotificationGroup[] {
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.read || !shouldMark(item.id) ? item : { ...item, read: true },
    ),
  }));
}

export type DemoNotificationsController = {
  groups: NotificationGroup[];
  unreadCount: number;
  refreshing: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => Promise<void>;
};

export function useDemoNotifications(): DemoNotificationsController {
  const [groups, setGroups] = useState<NotificationGroup[]>(cloneDemoGroups);
  const [refreshing, setRefreshing] = useState(false);

  const markRead = useCallback((id: string) => {
    setGroups((current) => markItems(current, (itemId) => itemId === id));
  }, []);

  const markAllRead = useCallback(() => {
    setGroups((current) => markItems(current, () => true));
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setGroups(cloneDemoGroups());
    } finally {
      setRefreshing(false);
    }
  }, []);

  const unreadCount = useMemo(() => countUnread(groups), [groups]);

  return { groups, unreadCount, refreshing, markRead, markAllRead, refresh };
}
