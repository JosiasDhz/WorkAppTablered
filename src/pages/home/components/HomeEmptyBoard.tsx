import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Category } from "iconsax-react-native";
import { HOME_COLORS, HOME_RADIUS } from "../homeTheme";

export function HomeEmptyBoard() {
  return (
    <View style={styles.card}>
      <View style={styles.iconSlot}>
        <Category size={22} color={HOME_COLORS.accent} variant="Linear" />
      </View>
      <Text style={styles.title}>Tu inicio está en construcción</Text>
      <Text style={styles.body}>
        Aquí vamos a mostrar tus accesos y resúmenes del día.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: HOME_COLORS.surface,
    borderRadius: HOME_RADIUS.section,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  iconSlot: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: HOME_COLORS.accentSoft,
  },
  title: {
    marginTop: 14,
    fontSize: 15.5,
    fontWeight: "700",
    color: HOME_COLORS.ink,
    textAlign: "center",
  },
  body: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: HOME_COLORS.muted,
    textAlign: "center",
  },
});
