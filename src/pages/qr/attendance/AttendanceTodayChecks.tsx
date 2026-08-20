import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { MyAttendanceEventDto } from "../../../services/attendanceService";
import {
  describeEventPlace,
  describeEventType,
  formatEventTime,
} from "./attendanceEventFormat";
import { ATTENDANCE_COLORS, ATTENDANCE_RADIUS } from "./attendanceTheme";

export type AttendanceTodayChecksProps = {
  events: MyAttendanceEventDto[];
  loading: boolean;
};

export function AttendanceTodayChecks({
  events,
  loading,
}: AttendanceTodayChecksProps) {
  return (
    <React.Fragment>
      <Text style={styles.sectionTitle}>Chequeos de hoy</Text>
      <View style={styles.card}>
        {events.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>
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
                index < events.length - 1 && styles.rowBorder,
              ]}
            >
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {describeEventType(event)}
                </Text>
                <Text style={styles.rowPlace} numberOfLines={1}>
                  {describeEventPlace(event)}
                </Text>
              </View>
              <Text style={styles.rowTime}>
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
    color: ATTENDANCE_COLORS.muted,
  },
  card: {
    backgroundColor: ATTENDANCE_COLORS.surface,
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
    color: ATTENDANCE_COLORS.muted,
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
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ATTENDANCE_COLORS.divider,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: ATTENDANCE_COLORS.ink,
  },
  rowPlace: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
    color: ATTENDANCE_COLORS.muted,
  },
  rowTime: {
    fontSize: 14,
    fontWeight: "700",
    color: ATTENDANCE_COLORS.ink,
    fontVariant: ["tabular-nums"],
  },
});
