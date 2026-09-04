import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Notification } from "iconsax-react-native";
import { useNotificationColors } from "./notificationsTheme";

export function NotificationsEmptyState() {
  const colors = useNotificationColors();

  return (
    <View style={styles.empty}>
      <View style={[styles.iconWell, { backgroundColor: colors.accentSoft }]}>
        <Notification size={28} color={colors.accent} variant="Linear" />
      </View>
      <Text style={[styles.title, { color: colors.ink }]}>
        Sin notificaciones
      </Text>
      <Text style={[styles.sub, { color: colors.muted }]}>
        Cuando haya avisos nuevos, aparecen aquí.
      </Text>
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  sub: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
  },
});
