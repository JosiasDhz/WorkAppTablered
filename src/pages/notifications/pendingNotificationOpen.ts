type PendingNotificationOpen = {
  notificationId: string;
  title?: string;
  body?: string;
  type?: string;
};

let pending: PendingNotificationOpen | null = null;

export function markPendingNotificationOpen(
  input: PendingNotificationOpen,
): void {
  const id = input.notificationId?.trim();
  if (!id) return;
  pending = {
    notificationId: id,
    title: input.title,
    body: input.body,
    type: input.type,
  };
}

export function consumePendingNotificationOpen(): PendingNotificationOpen | null {
  const next = pending;
  pending = null;
  return next;
}
