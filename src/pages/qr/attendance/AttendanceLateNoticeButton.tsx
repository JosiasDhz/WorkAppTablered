import React from "react";
import { StyleSheet, Text } from "react-native";
import { InfoCircle } from "iconsax-react-native";
import { SoftPressable } from "../../../components/SoftPressable";
import { ATTENDANCE_COLORS, ATTENDANCE_RADIUS } from "./attendanceTheme";

export type AttendanceLateNoticeButtonProps = {
  onPress: () => void;
};

export function AttendanceLateNoticeButton({
  onPress,
}: AttendanceLateNoticeButtonProps) {
  return (
    <SoftPressable
      onPress={onPress}
      scaleTo={0.99}
      style={styles.card}
      accessibilityLabel="Avisar incidencia de asistencia"
    >
      <InfoCircle size={22} color={ATTENDANCE_COLORS.accent} variant="Linear" />
      <Text style={styles.label}>No checaré o llegaré tarde</Text>
    </SoftPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: ATTENDANCE_COLORS.surface,
    borderRadius: ATTENDANCE_RADIUS.section,
  },
  label: {
    fontSize: 16,
    fontWeight: "400",
    color: ATTENDANCE_COLORS.accent,
  },
});
