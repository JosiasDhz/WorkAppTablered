import React from "react";
import { StyleSheet, View } from "react-native";
import { Coffee, LoginCurve, LogoutCurve, Timer1 } from "iconsax-react-native";
import { useHomeColors } from "../homeTheme";
import { HomeKpiCard, type HomeKpiTone } from "./HomeKpiCard";
import {
  formatAttendanceClock,
  formatScheduleHmm,
} from "./formatAttendanceClock";
import type {
  WorkerAttendanceKpi,
  WorkerAttendanceNextCheckCode,
} from "../../../services/workerKpisService";

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
  const homeColors = useHomeColors();
  const view = resolveAttendanceView(attendance, loading);
  const ink =
    view.tone === "ok"
      ? homeColors.positive
      : view.tone === "pending"
        ? homeColors.warning
        : homeColors.accent;
  const wash =
    view.tone === "ok"
      ? homeColors.positiveSoft
      : view.tone === "pending"
        ? homeColors.warningSoft
        : homeColors.accentSoft;

  return (
    <HomeKpiCard
      status={view.status}
      caption={view.expected ?? ""}
      tone={view.tone}
      accessibilityLabel={`${view.status}. ${view.expected ?? ""}`}
      graphic={
        <View style={[styles.mark, { backgroundColor: wash }]}>
          {checkIcon(view.code, ink)}
        </View>
      }
      onPress={onPress}
      style={styles.card}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
