import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PageFlipReveal } from "../../components/PageFlipReveal";
import { NotificationRow } from "./NotificationRow";
import type { NotificationGroup } from "./notificationTypes";
import { NOTIFICATION_COLORS } from "./notificationsTheme";

export const NOTIFICATION_FLIP_STAGGER_MS = 70;
const MAX_FLIP_DELAY_MS = 700;

export function clampFlipDelay(delay: number): number {
  return Math.min(delay, MAX_FLIP_DELAY_MS);
}

export type NotificationGroupSectionProps = {
  group: NotificationGroup;
  onSelect: (id: string) => void;
  revealDelay?: number;
  revealActive?: boolean;
};

export function NotificationGroupSection({
  group,
  onSelect,
  revealDelay = 0,
  revealActive = true,
}: NotificationGroupSectionProps) {
  return (
    <React.Fragment>
      <PageFlipReveal delay={clampFlipDelay(revealDelay)} active={revealActive}>
        <Text style={styles.sectionTitle}>{group.title}</Text>
      </PageFlipReveal>
      <View style={styles.list}>
        {group.items.map((item, index) => (
          <PageFlipReveal
            key={item.id}
            delay={clampFlipDelay(
              revealDelay + (index + 1) * NOTIFICATION_FLIP_STAGGER_MS,
            )}
            active={revealActive}
          >
            <NotificationRow
              item={item}
              onPress={() => onSelect(item.id)}
            />
          </PageFlipReveal>
        ))}
      </View>
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginLeft: 4,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "600",
    color: NOTIFICATION_COLORS.muted,
  },
  list: {
    gap: 12,
  },
});
