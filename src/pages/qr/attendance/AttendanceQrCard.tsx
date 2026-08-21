import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { ScanBarcode } from "iconsax-react-native";
import { AttendanceCheckSuccess } from "./AttendanceCheckSuccess";
import { AttendanceDateTimeStrip } from "./AttendanceDateTimeStrip";
import { AttendanceExpiryRing } from "./AttendanceExpiryRing";
import { ATTENDANCE_COLORS, ATTENDANCE_RADIUS } from "./attendanceTheme";

const QR_INSET = 18;
const PLACEHOLDER_QR = "tablered-attendance-placeholder";

function AttendanceQrPlaceholder({ size }: { size: number }) {
  const shimmer = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  return (
    <View style={styles.placeholderWrap} pointerEvents="none">
      {size > 0 ? (
        <Animated.View style={[styles.placeholderQr, { opacity: shimmer }]}>
          <QRCode
            value={PLACEHOLDER_QR}
            size={size}
            color={ATTENDANCE_COLORS.qrForeground}
            backgroundColor="transparent"
            ecl="L"
            quietZone={4}
          />
        </Animated.View>
      ) : null}
      <View style={styles.placeholderBadge}>
        <Text style={styles.placeholder}>Actualizando…</Text>
      </View>
    </View>
  );
}

export type AttendanceQrCardProps = {
  payload: string;
  loading: boolean;
  secondsLeft: number;
  deadlineMs: number | null;
  windowMs: number;
  urgent: boolean;
  successWarehouseName: string | null;
};

export function AttendanceQrCard({
  payload,
  secondsLeft,
  deadlineMs,
  windowMs,
  urgent,
  successWarehouseName,
}: AttendanceQrCardProps) {
  const [areaSize, setAreaSize] = useState(0);
  const cardEnter = useRef(new Animated.Value(0)).current;
  const qrReveal = useRef(new Animated.Value(1)).current;
  const prevPayload = useRef(payload);

  useEffect(() => {
    cardEnter.setValue(0);
    Animated.spring(cardEnter, {
      toValue: 1,
      friction: 7,
      tension: 68,
      useNativeDriver: true,
    }).start();
  }, [cardEnter]);

  useEffect(() => {
    if (!payload || payload === prevPayload.current) return;
    prevPayload.current = payload;
    qrReveal.setValue(0.86);
    Animated.sequence([
      Animated.timing(qrReveal, {
        toValue: 0.92,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(qrReveal, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [payload, qrReveal]);

  const onAreaLayout = useCallback((e: LayoutChangeEvent) => {
    const side = Math.round(e.nativeEvent.layout.width);
    setAreaSize((prev) => (prev === side ? prev : side));
  }, []);

  const qrSize = Math.max(0, areaSize - QR_INSET * 2);
  const showsQr = Boolean(payload) && !successWarehouseName;
  const cardScale = cardEnter.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: cardEnter,
          transform: [{ scale: cardScale }],
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerIcon}>
          <ScanBarcode
            size={20}
            color={ATTENDANCE_COLORS.accent}
            variant="Linear"
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            QR de asistencia
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {successWarehouseName ? "Registrado" : "Escanea en sucursal"}
          </Text>
        </View>
        {showsQr ? (
          <AttendanceExpiryRing
            secondsLeft={secondsLeft}
            deadlineMs={deadlineMs}
            windowMs={windowMs}
            urgent={urgent}
          />
        ) : null}
      </View>

      <View style={styles.area} onLayout={onAreaLayout}>
        {successWarehouseName ? (
          <AttendanceCheckSuccess warehouseName={successWarehouseName} />
        ) : showsQr && qrSize > 0 ? (
          <Animated.View
            style={{
              opacity: qrReveal,
              transform: [{ scale: qrReveal }],
            }}
          >
            <QRCode
              value={payload}
              size={qrSize}
              color={ATTENDANCE_COLORS.qrForeground}
              backgroundColor="transparent"
              ecl="L"
              quietZone={4}
            />
          </Animated.View>
        ) : (
          <AttendanceQrPlaceholder size={qrSize} />
        )}
      </View>

      <View style={styles.divider} />
      <AttendanceDateTimeStrip />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: ATTENDANCE_COLORS.surface,
    borderRadius: ATTENDANCE_RADIUS.card,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  cardHeader: {
    paddingHorizontal: QR_INSET - 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: ATTENDANCE_COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: ATTENDANCE_COLORS.ink,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12.5,
    fontWeight: "500",
    color: ATTENDANCE_COLORS.muted,
  },
  area: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  placeholderWrap: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderQr: {
    opacity: 0.22,
  },
  placeholderBadge: {
    position: "absolute",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  placeholder: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: ATTENDANCE_COLORS.muted,
  },
  divider: {
    marginTop: -6,
    marginHorizontal: QR_INSET,
    height: StyleSheet.hairlineWidth,
    backgroundColor: ATTENDANCE_COLORS.divider,
  },
});
