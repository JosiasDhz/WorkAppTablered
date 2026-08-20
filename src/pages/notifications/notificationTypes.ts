export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  timeLabel: string;
  read: boolean;
};

export type NotificationGroup = {
  id: string;
  title: string;
  items: NotificationItem[];
};

export function countUnread(groups: NotificationGroup[]): number {
  return groups.reduce(
    (total, group) => total + group.items.filter((item) => !item.read).length,
    0,
  );
}
