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
import { ArrowRotateLeft, ScanBarcode, Warning2 } from "iconsax-react-native";
import { SoftPressable } from "../../../components/SoftPressable";
import { AttendanceCheckSuccess } from "./AttendanceCheckSuccess";
import { AttendanceDateTimeStrip } from "./AttendanceDateTimeStrip";
import { AttendanceExpiryRing } from "./AttendanceExpiryRing";
import {
  ATTENDANCE_RADIUS,
  useAttendanceColors,
  type AttendanceColors,
} from "./attendanceTheme";

const QR_EDGE = 18;
const QR_MAX = 280;
const QR_QUIET_ZONE = 10;
const PLACEHOLDER_QR = "tablered-attendance-placeholder";

function AttendanceQrPlaceholder({
  size,
  colors,
}: {
  size: number;
  colors: AttendanceColors;
}) {
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
            color={colors.qrForeground}
            backgroundColor="transparent"
            ecl="M"
            quietZone={QR_QUIET_ZONE}
          />
        </Animated.View>
      ) : null}
      <View
        style={[styles.placeholderBadge, { backgroundColor: colors.accentSoft }]}
      >
        <Text style={[styles.placeholder, { color: colors.accent }]}>
          Generando código…
        </Text>
      </View>
    </View>
  );
}

function AttendanceQrError({
  message,
  onRetry,
  colors,
}: {
  message: string;
  onRetry: () => void;
  colors: AttendanceColors;
}) {
  return (
    <View style={styles.errorWrap}>
      <View style={[styles.errorIcon, { backgroundColor: colors.urgentSoft }]}>
        <Warning2 size={28} color={colors.urgent} variant="Bold" />
      </View>
      <Text style={[styles.errorTitle, { color: colors.ink }]}>
        No se pudo cargar el QR
      </Text>
      <Text style={[styles.errorBody, { color: colors.muted }]}>{message}</Text>
      <SoftPressable
        onPress={onRetry}
        scaleTo={0.97}
        style={[styles.retryBtn, { backgroundColor: colors.accent }]}
        accessibilityLabel="Reintentar cargar código QR"
      >
        <ArrowRotateLeft size={18} color="#FFFFFF" variant="Bold" />
        <Text style={styles.retryTxt}>Reintentar</Text>
      </SoftPressable>
    </View>
  );
}

export type AttendanceQrCardProps = {
  payload: string;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  secondsLeft: number;
  deadlineMs: number | null;
  windowMs: number;
  urgent: boolean;
  successWarehouseName: string | null;
};

export function AttendanceQrCard({
  payload,
  loading,
  error,
  onRetry,
  secondsLeft,
  deadlineMs,
  windowMs,
  urgent,
  successWarehouseName,
}: AttendanceQrCardProps) {
  const colors = useAttendanceColors();
  const [areaSize, setAreaSize] = useState(0);
  const [updatedFlash, setUpdatedFlash] = useState(false);
  const cardEnter = useRef(new Animated.Value(0)).current;
  const qrReveal = useRef(new Animated.Value(1)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
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
    const isRotate = Boolean(prevPayload.current);
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

    if (!isRotate) return;
    setUpdatedFlash(true);
    flashOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.delay(1400),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setUpdatedFlash(false);
    });
  }, [payload, qrReveal, flashOpacity]);

  const onAreaLayout = useCallback((e: LayoutChangeEvent) => {
    const side = Math.round(e.nativeEvent.layout.width);
    if (side <= 0) return;
    setAreaSize((prev) => (prev === side ? prev : side));
  }, []);

  const qrSize = Math.max(0, areaSize - QR_EDGE * 2);
  const showsQr = Boolean(payload) && !successWarehouseName;
  const showsError =
    !successWarehouseName && !payload && !loading && Boolean(error);
  const cardScale = cardEnter.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  const subtitle = successWarehouseName
    ? "Registrado"
    : updatedFlash
      ? "Código actualizado"
      : showsError
        ? "Sin código disponible"
        : loading && !payload
          ? "Preparando código"
          : "Escanea en sucursal";

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          opacity: cardEnter,
          transform: [{ scale: cardScale }],
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.headerIcon, { backgroundColor: colors.accentSoft }]}>
          <ScanBarcode size={20} color={colors.accent} variant="Linear" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>
            QR de asistencia
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: updatedFlash ? colors.accent : colors.muted },
            ]}
            numberOfLines={1}
          >
            {subtitle}
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

      <View
        style={[
          styles.area,
          {
            backgroundColor: colors.qrPlate,
            borderColor: colors.divider,
            height: areaSize > 0 ? areaSize : undefined,
            aspectRatio: areaSize > 0 ? undefined : 1,
          },
        ]}
        onLayout={onAreaLayout}
      >
        {successWarehouseName ? (
          <AttendanceCheckSuccess warehouseName={successWarehouseName} />
        ) : showsError && onRetry ? (
          <AttendanceQrError
            message={error ?? "Intenta de nuevo en unos segundos."}
            onRetry={onRetry}
            colors={colors}
          />
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
              color={colors.qrForeground}
              backgroundColor="transparent"
              ecl="M"
              quietZone={QR_QUIET_ZONE}
            />
          </Animated.View>
        ) : (
          <AttendanceQrPlaceholder size={qrSize} colors={colors} />
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      <AttendanceDateTimeStrip />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: ATTENDANCE_RADIUS.card,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
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
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12.5,
    fontWeight: "500",
  },
  area: {
    width: "100%",
    maxWidth: QR_MAX,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
  },
  placeholderWrap: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderQr: {
    opacity: 0.18,
  },
  placeholderBadge: {
    position: "absolute",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  placeholder: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
  },
  errorWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
  errorIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  errorBody: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 10,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  retryTxt: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  divider: {
    marginTop: 8,
    height: StyleSheet.hairlineWidth,
  },
});
