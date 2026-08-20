import React from "react";
import { StyleSheet, View } from "react-native";
import { Coffee, LoginCurve, LogoutCurve, Timer1 } from "iconsax-react-native";
import { HOME_COLORS } from "../homeTheme";
import { HomeKpiCard, type HomeKpiTone } from "./HomeKpiCard";
import {
  formatAttendanceClock,
  formatScheduleHmm,
} from "./formatAttendanceClock";
import type {
  WorkerAttendanceKpi,
  WorkerAttendanceNextCheckCode,
} from "../../../services/workerKpisService";

const TONE_INK: Record<HomeKpiTone, string> = {
  ok: HOME_COLORS.positive,
  pending: HOME_COLORS.warning,
  neutral: HOME_COLORS.accent,
};

const TONE_WASH: Record<HomeKpiTone, string> = {
  ok: HOME_COLORS.positiveSoft,
  pending: HOME_COLORS.warningSoft,
  neutral: HOME_COLORS.accentSoft,
};

const CHECK_STATUS: Record<WorkerAttendanceNextCheckCode, string> = {
  TRABAJO_ENTRADA: "Entrada pendiente",
  COMIDA_ENTRADA: "Comida pendiente",
  COMIDA_SALIDA: "Fin comida pendiente",
  TRABAJO_SALIDA: "Salida pendiente",
};

export type HomeAttendanceKpiProps = {
  attendance: WorkerAttendanceKpi | null;
  loading: boolean;
  onPress: () => void;
};

function checkIcon(code: WorkerAttendanceNextCheckCode, color: string) {
  if (code === "TRABAJO_ENTRADA") {
    return <LoginCurve size={28} color={color} variant="Linear" />;
  }
  if (code === "TRABAJO_SALIDA") {
    return <LogoutCurve size={28} color={color} variant="Linear" />;
  }
  if (code === "COMIDA_ENTRADA") {
    return <Coffee size={28} color={color} variant="Linear" />;
  }
  return <Timer1 size={28} color={color} variant="Linear" />;
}

function expectedClockLabel(attendance: WorkerAttendanceKpi): string | null {
  const arrival = formatScheduleHmm(attendance.estimatedArrivalHmm);
  const leave = formatScheduleHmm(attendance.estimatedLeaveHmm);
  const code = attendance.nextCheckCode;

  if (!code) {
    const done = formatAttendanceClock(attendance.completedExitAt);
    if (done) return `Salida ${done}`;
    return leave ? `Salida ${leave}` : null;
  }

  if (code === "TRABAJO_ENTRADA") {
    return arrival ? `Entrada ${arrival}` : null;
  }

  return leave ? `Salida ${leave}` : arrival ? `Entrada ${arrival}` : null;
}

function resolveAttendanceView(
  attendance: WorkerAttendanceKpi | null,
  loading: boolean,
) {
  if (loading) {
    return {
      tone: "neutral" as HomeKpiTone,
      status: "Cargando",
      expected: "Consultando horario",
      code: "TRABAJO_ENTRADA" as WorkerAttendanceNextCheckCode,
    };
  }

  if (!attendance) {
    return {
      tone: "neutral" as HomeKpiTone,
      status: "No disponible",
      expected: "Sin horario",
      code: "TRABAJO_ENTRADA" as WorkerAttendanceNextCheckCode,
    };
  }

  if (!attendance.nextCheckCode) {
    return {
      tone: "ok" as HomeKpiTone,
      status: "Jornada completa",
      expected: expectedClockLabel(attendance) ?? "Ya registraste tu salida",
      code: "TRABAJO_SALIDA" as WorkerAttendanceNextCheckCode,
    };
  }

  return {
    tone: "pending" as HomeKpiTone,
    status: CHECK_STATUS[attendance.nextCheckCode],
    expected: expectedClockLabel(attendance) ?? "Abre el QR para checar",
    code: attendance.nextCheckCode,
  };
}

export function HomeAttendanceKpi({
  attendance,
  loading,
  onPress,
}: HomeAttendanceKpiProps) {
  const view = resolveAttendanceView(attendance, loading);
  const ink = TONE_INK[view.tone];

  return (
    <HomeKpiCard
      status={view.status}
      caption={view.expected ?? ""}
      tone={view.tone}
      accessibilityLabel={`${view.status}. ${view.expected ?? ""}`}
      graphic={
        <View style={[styles.mark, { backgroundColor: TONE_WASH[view.tone] }]}>
          {checkIcon(view.code, ink)}
        </View>
      }
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
