import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { AttendanceApprovedLeave } from "../../redux/slices/attendanceAccessSlice";
import { useAttendanceColors } from "../qr/attendance/attendanceTheme";
import { AttendanceGateLayout } from "./AttendanceGateLayout";

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function formatYmd(ymd: string): string {
  const [, month, day] = ymd.split("-").map(Number);
  const monthName = MONTHS[(month ?? 1) - 1] ?? "";
  return `${day} de ${monthName}`;
}

function leavePeriod(leave: AttendanceApprovedLeave): string {
  if (leave.startsOn === leave.endsOn) return `el ${formatYmd(leave.startsOn)}`;
  return `del ${formatYmd(leave.startsOn)} al ${formatYmd(leave.endsOn)}`;
}

export function AttendanceGateLeave({ leave }: { leave: AttendanceApprovedLeave }) {
  const colors = useAttendanceColors();
  const title = leave.isVacation ? "Estás de vacaciones" : "Tienes un permiso aprobado";
  const body = leave.isVacation
    ? `Tus vacaciones están aprobadas ${leavePeriod(leave)}.`
    : `Tu permiso por ${leave.label} está aprobado ${leavePeriod(leave)}.`;

  return (
    <AttendanceGateLayout title={title} subtitle="Hoy no necesitas checar asistencia">
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.ink }]}>{title}</Text>
        <Text style={[styles.cardBody, { color: colors.muted }]}>{body}</Text>
      </View>
    </AttendanceGateLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  cardBody: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
});
