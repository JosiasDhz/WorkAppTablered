import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useAppIsActive } from "../../hooks/useAppIsActive";
import { useBrightnessBoostWhile } from "../../hooks/useBrightnessBoostWhile";
import { useScreenCaptureGuard } from "../../hooks/useScreenCaptureGuard";
import { AttendanceQrCard } from "../qr/attendance/AttendanceQrCard";
import { AttendanceTodayChecks } from "../qr/attendance/AttendanceTodayChecks";
import { isExpiringSoon } from "../qr/attendance/expiryUrgency";
import { useWorkerAttendanceQr } from "../qr/attendance/useWorkerAttendanceQr";
import { AttendanceGateLayout } from "./AttendanceGateLayout";
import { useAttendanceGateAutoRefresh } from "./useAttendanceGateAutoRefresh";

export function AttendanceGateCheckIn() {
  const appIsActive = useAppIsActive();

  const {
    payload,
    secondsLeft,
    deadlineMs,
    windowMs,
    context,
    contextLoading,
    contextError,
    qrError,
    retryQr,
    checkSuccess,
  } = useWorkerAttendanceQr({ active: appIsActive });

  const successWarehouseName = checkSuccess?.warehouseName ?? null;
  const urgent = !successWarehouseName && isExpiringSoon(secondsLeft);
  useAttendanceGateAutoRefresh(appIsActive, checkSuccess);
  useBrightnessBoostWhile(appIsActive && !successWarehouseName);
  useScreenCaptureGuard(true);

  const todayEvents = useMemo(
    () => [...(context?.todayEvents ?? [])].reverse(),
    [context],
  );

  return (
    <AttendanceGateLayout
      title={successWarehouseName ? "Chequeo exitoso" : "Checa tu asistencia"}
      subtitle={
        successWarehouseName
          ? "Verificando tu acceso…"
          : "Acerca el código al lector de la sucursal"
      }
    >
      <View style={styles.qrBlock}>
        <AttendanceQrCard
          payload={payload}
          loading={contextLoading}
          error={qrError ?? contextError}
          onRetry={() => {
            void retryQr();
          }}
          secondsLeft={secondsLeft}
          deadlineMs={deadlineMs}
          windowMs={windowMs}
          urgent={urgent}
          successWarehouseName={successWarehouseName}
        />
      </View>

      <View style={styles.sectionBlock}>
        <AttendanceTodayChecks events={todayEvents} loading={contextLoading} />
      </View>
    </AttendanceGateLayout>
  );
}

const styles = StyleSheet.create({
  qrBlock: {
    width: "100%",
    marginTop: 16,
  },
  sectionBlock: {
    width: "100%",
    marginTop: 22,
  },
});
