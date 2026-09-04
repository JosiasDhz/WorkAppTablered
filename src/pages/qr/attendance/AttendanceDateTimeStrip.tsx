import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLiveAttendanceClock } from "./useLiveAttendanceClock";
import { useAttendanceColors } from "./attendanceTheme";

export function AttendanceDateTimeStrip() {
  const { dateLine, timeLine } = useLiveAttendanceClock();
  const colors = useAttendanceColors();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.time, { color: colors.ink }]}>{timeLine}</Text>
      <Text style={[styles.date, { color: colors.muted }]}>{dateLine}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    marginTop: 10,
    paddingBottom: 2,
  },
  time: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -0.75,
    lineHeight: 44,
    fontVariant: ["tabular-nums"],
  },
  date: {
    marginTop: 1,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 17,
  },
});
