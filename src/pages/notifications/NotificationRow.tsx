import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ArrowRight2 } from "iconsax-react-native";
import { SoftPressable } from "../../components/SoftPressable";
import { resolveNotificationAppearance } from "./notificationAppearance";
import type { NotificationItem } from "./notificationTypes";
import { NOTIFICATION_COLORS, NOTIFICATION_RADIUS } from "./notificationsTheme";

export type NotificationRowProps = {
  item: NotificationItem;
  onPress: () => void;
};

export function NotificationRow({ item, onPress }: NotificationRowProps) {
  const { Icon, tint, wash } = resolveNotificationAppearance(item.type);

  return (
    <SoftPressable
      onPress={onPress}
      scaleTo={0.99}
      accessibilityLabel={item.title}
    >
      <View style={styles.card}>
        <View style={[styles.well, { backgroundColor: wash }]}>
          <Icon size={20} color={tint} variant="Linear" />
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, !item.read && styles.titleUnread]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {item.read ? null : <View style={styles.dot} />}
            <Text style={styles.time}>{item.timeLabel}</Text>
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
        <ArrowRight2 size={16} color={NOTIFICATION_COLORS.muted} variant="Linear" />
      </View>
    </SoftPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: NOTIFICATION_COLORS.surface,
    borderRadius: NOTIFICATION_RADIUS.section,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  well: {
    width: 38,
    height: 38,
    borderRadius: NOTIFICATION_RADIUS.well,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "600",
    color: NOTIFICATION_COLORS.ink,
  },
  titleUnread: {
    fontWeight: "700",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: NOTIFICATION_COLORS.accent,
  },
  time: {
    fontSize: 12,
    fontWeight: "500",
    color: NOTIFICATION_COLORS.muted,
  },
  body: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: NOTIFICATION_COLORS.muted,
  },
});
