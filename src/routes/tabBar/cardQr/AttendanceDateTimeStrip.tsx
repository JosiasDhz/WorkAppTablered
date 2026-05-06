import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLiveAttendanceClock } from "./useLiveAttendanceClock";

export function AttendanceDateTimeStrip() {
  const { dateLine, timeLine } = useLiveAttendanceClock();

  return (
    <View style={styles.wrap}>
      <Text style={styles.time}>{timeLine}</Text>
      <Text style={styles.date}>{dateLine}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    marginTop: 14,
    paddingBottom: 2,
  },
  time: {
    fontSize: 41,
    fontWeight: "900",
    color: "#020617",
    letterSpacing: -0.75,
    lineHeight: 46,
    fontVariant: ["tabular-nums"],
  },
  date: {
    marginTop: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 17,
  },
});
