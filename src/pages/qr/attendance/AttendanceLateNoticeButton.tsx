import React from "react";
import { StyleSheet, Text } from "react-native";
import { InfoCircle } from "iconsax-react-native";
import { SoftPressable } from "../../../components/SoftPressable";
import { ATTENDANCE_RADIUS, useAttendanceColors } from "./attendanceTheme";

export type AttendanceLateNoticeButtonProps = {
  onPress: () => void;
};

export function AttendanceLateNoticeButton({
  onPress,
}: AttendanceLateNoticeButtonProps) {
  const colors = useAttendanceColors();

  return (
    <SoftPressable
      onPress={onPress}
      scaleTo={0.99}
      style={[styles.card, { backgroundColor: colors.surface }]}
      accessibilityLabel="Avisar incidencia de asistencia"
    >
      <InfoCircle size={22} color={colors.accent} variant="Linear" />
      <Text style={[styles.label, { color: colors.accent }]}>
        No checaré o llegaré tarde
      </Text>
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
    borderRadius: ATTENDANCE_RADIUS.section,
  },
  label: {
    fontSize: 16,
    fontWeight: "400",
  },
});
