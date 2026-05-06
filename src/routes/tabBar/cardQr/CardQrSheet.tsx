import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Svg, { Circle } from "react-native-svg";
import QRCode from "react-native-qrcode-svg";
import { Card } from "iconsax-react-native";
import { TAB_BAR_PRIMARY } from "../tabBarConstants";
import { useWorkerAttendanceQr } from "./useWorkerAttendanceQr";
import { AttendanceDateTimeStrip } from "./AttendanceDateTimeStrip";

const TIMER_ENDING_SECONDS = 5;
const ENDING_HAPTIC_INTERVAL_MS = 500;
const TIMER_URGENT_RED = "#DC2626";
const QR_EDGE_INSET = 24;
const TIMER_SIZE = 36;
const TIMER_STROKE = 3.5;
const TIMER_RADIUS = (TIMER_SIZE - TIMER_STROKE) / 2;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

export type CardQrSheetProps = {
  progress: Animated.Value;
  onClose: () => void;
};

export function CardQrSheet({ progress, onClose }: CardQrSheetProps) {
  const { payload, secondsLeft, timerProgress, cycle } =
    useWorkerAttendanceQr();
  const timerOffset = TIMER_CIRCUMFERENCE * (1 - timerProgress);
  const timerFade = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const initializedCycleRef = useRef(false);
  const [qrPixelSize, setQrPixelSize] = useState(0);

  const endingSoon =
    secondsLeft <= TIMER_ENDING_SECONDS && secondsLeft >= 1;

  useEffect(() => {
    if (!endingSoon) {
      return;
    }
    let step = 0;
    const pulse = () => {
      step += 1;
      if (step % 2 === 1) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        void Haptics.selectionAsync();
      }
    };
    pulse();
    const id = setInterval(pulse, ENDING_HAPTIC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [endingSoon]);

  const onQrSquareLayout = useCallback((e: LayoutChangeEvent) => {
    const side = Math.round(e.nativeEvent.layout.width);
    const next = Math.max(0, side - QR_EDGE_INSET * 2);
    setQrPixelSize((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => {
    pulseLoopRef.current?.stop();
    pulseLoopRef.current = null;
    pulseScale.setValue(1);
  }, [cycle, pulseScale]);

  useEffect(() => {
    return () => {
      pulseLoopRef.current?.stop();
      pulseLoopRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (secondsLeft > TIMER_ENDING_SECONDS || secondsLeft < 1) {
      pulseLoopRef.current?.stop();
      pulseLoopRef.current = null;
      pulseScale.setValue(1);
      return;
    }
    if (pulseLoopRef.current) {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.14,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoopRef.current = loop;
    loop.start();
  }, [secondsLeft, pulseScale]);

  useEffect(() => {
    if (!initializedCycleRef.current) {
      initializedCycleRef.current = true;
      return;
    }
    Animated.sequence([
      Animated.timing(timerFade, {
        toValue: 0.2,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(timerFade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cycle, timerFade]);

  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [34, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <Animated.View pointerEvents="box-none" style={[styles.layer, { opacity }]}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 100 : 100}
          tint="light"
          {...(Platform.OS === "android"
            ? {
                experimentalBlurMethod: "dimezisBlurView" as const,
                blurReductionFactor: 1,
              }
            : {})}
          style={styles.sheetBlur}
        >
          <View pointerEvents="none" style={styles.sheetTint} />
          <View style={styles.sheetContent}>
            <View style={styles.headerRow}>
              <View style={styles.cardIcon}>
                <Card size={22} color="#FFFFFF" variant="Bold" />
              </View>
              <View style={styles.headerTextWrap}>
                <Text style={styles.title}>Qr de asistencia</Text>
                <Text style={styles.subtitle}>Escanea en sucursal</Text>
              </View>
              <Animated.View style={[styles.countdownWrap, { opacity: timerFade }]}>
                <Animated.View
                  style={{
                    width: TIMER_SIZE,
                    height: TIMER_SIZE,
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [{ scale: pulseScale }],
                  }}
                >
                  <Svg width={TIMER_SIZE} height={TIMER_SIZE}>
                    <Circle
                      cx={TIMER_SIZE / 2}
                      cy={TIMER_SIZE / 2}
                      r={TIMER_RADIUS}
                      stroke={
                        endingSoon
                          ? "rgba(220, 38, 38, 0.35)"
                          : "rgba(148, 163, 184, 0.35)"
                      }
                      strokeWidth={TIMER_STROKE}
                      fill="none"
                    />
                    <Circle
                      cx={TIMER_SIZE / 2}
                      cy={TIMER_SIZE / 2}
                      r={TIMER_RADIUS}
                      stroke={endingSoon ? TIMER_URGENT_RED : TAB_BAR_PRIMARY}
                      strokeWidth={TIMER_STROKE}
                      strokeLinecap="round"
                      strokeDasharray={`${TIMER_CIRCUMFERENCE} ${TIMER_CIRCUMFERENCE}`}
                      strokeDashoffset={timerOffset}
                      fill="none"
                      originX={TIMER_SIZE / 2}
                      originY={TIMER_SIZE / 2}
                      rotation={-90}
                    />
                  </Svg>
                  <Text
                    style={[
                      styles.countdownText,
                      endingSoon && styles.countdownTextUrgent,
                    ]}
                  >
                    {secondsLeft}s
                  </Text>
                </Animated.View>
              </Animated.View>
            </View>
            <View style={styles.qrWrap} onLayout={onQrSquareLayout}>
              {qrPixelSize > 0 ? (
                <View
                  style={{
                    width: qrPixelSize,
                    height: qrPixelSize,
                    borderRadius: Math.max(14, Math.round(qrPixelSize * 0.055)),
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255,255,255,0.25)",
                  }}
                >
                  {payload ? (
                  <QRCode
                    value={payload}
                    size={qrPixelSize}
                    color="#0F172A"
                    backgroundColor="transparent"
                    ecl="L"
                    quietZone={4}
                  />
                  ) : (
                    <Text style={styles.placeholderQr}>Actualizando…</Text>
                  )}
                </View>
              ) : null}
            </View>
            {payload ? (
              <ScrollView
                style={styles.qrDebugScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                <Text selectable style={styles.qrDebugText}>
                  {payload}
                </Text>
              </ScrollView>
            ) : null}
            <AttendanceDateTimeStrip />
          </View>
        </BlurView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 110,
    zIndex: 40,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 24,
    borderWidth: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  sheetBlur: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor:
      Platform.OS === "ios"
        ? "rgba(255, 248, 240, 0.42)"
        : "rgba(255, 244, 232, 0.4)",
  },
  sheetTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      Platform.OS === "ios"
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(255, 255, 255, 0.12)",
  },
  sheetContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: TAB_BAR_PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: TAB_BAR_PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
  },
  countdownWrap: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  countdownText: {
    position: "absolute",
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
  },
  countdownTextUrgent: {
    color: TIMER_URGENT_RED,
  },
  placeholderQr: {
    paddingHorizontal: 16,
    textAlign: "center",
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  qrWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor:
      Platform.OS === "ios"
        ? "rgba(255, 252, 248, 0.9)"
        : "rgba(255, 250, 244, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  qrDebugScroll: {
    marginTop: 10,
    width: "100%",
    maxHeight: 88,
  },
  qrDebugText: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#64748B",
  },
});
