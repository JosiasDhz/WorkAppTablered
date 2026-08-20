import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Notification } from "iconsax-react-native";
import { NOTIFICATION_COLORS } from "./notificationsTheme";

export function NotificationsEmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.iconWell}>
        <Notification
          size={28}
          color={NOTIFICATION_COLORS.accent}
          variant="Linear"
        />
      </View>
      <Text style={styles.title}>Sin notificaciones</Text>
      <Text style={styles.sub}>Cuando haya avisos nuevos, aparecen aquí.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  iconWell: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: NOTIFICATION_COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: NOTIFICATION_COLORS.ink,
    textAlign: "center",
  },
  sub: {
    fontSize: 14,
    fontWeight: "500",
    color: NOTIFICATION_COLORS.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
