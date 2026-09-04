import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SoftReveal } from "../../components/SoftPressable";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { SCREEN_GUTTER } from "../../theme/layout";
import { useAppIsActive } from "../../hooks/useAppIsActive";
import { useBrightnessBoostWhile } from "../../hooks/useBrightnessBoostWhile";
import { useScreenCaptureGuard } from "../../hooks/useScreenCaptureGuard";
import { AttendanceCheckTypeSelector } from "./attendance/AttendanceCheckTypeSelector";
import { AttendanceLateNoticeButton } from "./attendance/AttendanceLateNoticeButton";
import { AttendanceNoticeFormModal } from "./attendance/AttendanceNoticeFormModal";
import { AttendanceQrCard } from "./attendance/AttendanceQrCard";
import { AttendanceTodayChecks } from "./attendance/AttendanceTodayChecks";
import { useAttendanceColors } from "./attendance/attendanceTheme";
import {
  isExpiringSoon,
  useExpiryUrgencyHaptics,
} from "./attendance/expiryUrgency";
import { useWorkerAttendanceQr } from "./attendance/useWorkerAttendanceQr";

function resolveStatusLabel(
  successWarehouseName: string | null,
  selectedCheckTypeCode: string | null,
): string {
  if (successWarehouseName) return successWarehouseName;
  if (selectedCheckTypeCode) return "Comida seleccionada: escanea en sucursal";
  return "Acerca el código al lector de la sucursal";
}

export default function QrScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();
  const isFocused = useIsFocused();
  const appIsActive = useAppIsActive();
  const colors = useAttendanceColors();
  const screenIsLive = isFocused && appIsActive;
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    payload,
    secondsLeft,
    deadlineMs,
    windowMs,
    context,
    contextLoading,
    contextError,
    qrError,
    selectedCheckTypeCode,
    setSelectedCheckTypeCode,
    checkTypeOptions,
    refreshContext,
    retryQr,
    checkSuccess,
  } = useWorkerAttendanceQr({ active: screenIsLive });

  const successWarehouseName = checkSuccess?.warehouseName ?? null;
  const urgent = !successWarehouseName && isExpiringSoon(secondsLeft);

  useBrightnessBoostWhile(screenIsLive && !successWarehouseName);
  useScreenCaptureGuard(isFocused);
  useExpiryUrgencyHaptics(urgent && screenIsLive);

  const showTypeSelector =
    !contextLoading && checkTypeOptions.length > 0 && !successWarehouseName;
  const showLateNotice =
    !contextLoading &&
    Boolean(context) &&
    !context?.hasWorkStart &&
    !successWarehouseName;

  useEffect(() => {
    if (!showLateNotice && noticeModalOpen) {
      setNoticeModalOpen(false);
    }
  }, [showLateNotice, noticeModalOpen]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshContext();
    } finally {
      setRefreshing(false);
    }
  }, [refreshContext]);

  const todayEvents = useMemo(
    () => [...(context?.todayEvents ?? [])].reverse(),
    [context],
  );

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <SoftReveal active={isFocused} delay={0}>
        <HeaderTitle
          title={successWarehouseName ? "Chequeo exitoso" : "Mi asistencia"}
          subtitle={resolveStatusLabel(
            successWarehouseName,
            selectedCheckTypeCode,
          )}
          tone="light"
          style={styles.header}
        />
      </SoftReveal>

      <ScrollView
        onScroll={onAutoTabBarScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(tabBarHeight, insets.bottom) + 36 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.ink}
          />
        }
      >
        <SoftReveal active={isFocused} delay={40} style={styles.qrBlock}>
          {contextError ? (
            <Text style={[styles.contextError, { color: colors.urgent }]}>
              {contextError}
            </Text>
          ) : null}
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
        </SoftReveal>

        {showTypeSelector ? (
          <SoftReveal active={isFocused} delay={120}>
            <AttendanceCheckTypeSelector
              options={checkTypeOptions}
              selectedCode={selectedCheckTypeCode}
              onSelect={setSelectedCheckTypeCode}
              disabled={contextLoading}
            />
          </SoftReveal>
        ) : null}

        {showLateNotice ? (
          <SoftReveal active={isFocused} delay={180} style={styles.noticeBlock}>
            <AttendanceLateNoticeButton
              onPress={() => setNoticeModalOpen(true)}
            />
          </SoftReveal>
        ) : null}

        <SoftReveal active={isFocused} delay={240} style={styles.sectionBlock}>
          <AttendanceTodayChecks
            events={todayEvents}
            loading={contextLoading}
          />
        </SoftReveal>
      </ScrollView>

      <AttendanceNoticeFormModal
        visible={noticeModalOpen}
        onClose={() => setNoticeModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SCREEN_GUTTER,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "stretch",
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 4,
  },
  qrBlock: {
    width: "100%",
    marginTop: 8,
  },
  contextError: {
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  noticeBlock: {
    width: "100%",
    marginTop: 18,
  },
  sectionBlock: {
    width: "100%",
    marginTop: 22,
  },
});
