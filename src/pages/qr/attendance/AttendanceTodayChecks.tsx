import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { MyAttendanceEventDto } from "../../../services/attendanceService";
import {
  describeEventPlace,
  describeEventType,
  formatEventTime,
} from "./attendanceEventFormat";
import { ATTENDANCE_RADIUS, useAttendanceColors } from "./attendanceTheme";

export type AttendanceTodayChecksProps = {
  events: MyAttendanceEventDto[];
  loading: boolean;
};

export function AttendanceTodayChecks({
  events,
  loading,
}: AttendanceTodayChecksProps) {
  const colors = useAttendanceColors();

  return (
    <React.Fragment>
      <Text style={[styles.sectionTitle, { color: colors.muted }]}>
        Chequeos de hoy
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {events.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {loading
                ? "Cargando tus chequeos…"
                : "Aún no tienes chequeos registrados hoy."}
            </Text>
          </View>
        ) : (
          events.map((event, index) => (
            <View
              key={event.id}
              style={[
                styles.row,
                index < events.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.divider,
                },
              ]}
            >
              <View style={styles.rowMain}>
                <Text
                  style={[styles.rowTitle, { color: colors.ink }]}
                  numberOfLines={1}
                >
                  {describeEventType(event)}
                </Text>
                <Text
                  style={[styles.rowPlace, { color: colors.muted }]}
                  numberOfLines={1}
                >
                  {describeEventPlace(event)}
                </Text>
              </View>
              <Text style={[styles.rowTime, { color: colors.ink }]}>
                {formatEventTime(event.registeredAt)}
              </Text>
            </View>
          ))
        )}
      </View>
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginLeft: 16,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    borderRadius: ATTENDANCE_RADIUS.section,
    overflow: "hidden",
  },
  emptyRow: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  row: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowPlace: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
  },
  rowTime: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
