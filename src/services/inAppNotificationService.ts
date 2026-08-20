import http from "../api/http-common";

const prefix = "/in-app-notifications";

export type InAppNotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export async function listInAppNotifications(params?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}): Promise<{ items: InAppNotificationRow[]; total: number }> {
  const { data } = await http.get(prefix, {
    params: {
      limit: params?.limit,
      offset: params?.offset,
      unreadOnly: params?.unreadOnly,
    },
  });
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: Number(data?.total ?? 0),
  };
}

export async function getInAppUnreadCount(): Promise<number> {
  const { data } = await http.get(`${prefix}/unread-count`);
  return Number(data?.count ?? 0);
}

export async function getInAppNotification(
  id: string,
): Promise<InAppNotificationRow> {
  const { data } = await http.get(`${prefix}/${id}`);
  return {
    id: String(data?.id ?? id),
    type: String(data?.type ?? ""),
    title: String(data?.title ?? ""),
    body: String(data?.body ?? ""),
    payload:
      data?.payload && typeof data.payload === "object"
        ? (data.payload as Record<string, unknown>)
        : {},
    readAt: data?.readAt ? String(data.readAt) : null,
    createdAt: String(data?.createdAt ?? ""),
  };
}

export async function markInAppNotificationRead(id: string): Promise<void> {
  await http.patch(`${prefix}/${id}/read`);
}

export async function markAllInAppNotificationsRead(): Promise<number> {
  const { data } = await http.patch(`${prefix}/read-all`);
  return Number(data?.updated ?? 0);
}
