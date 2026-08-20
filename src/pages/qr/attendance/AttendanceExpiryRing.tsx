import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { ATTENDANCE_COLORS } from "./attendanceTheme";

const RING_SIZE = 46;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type AttendanceExpiryRingProps = {
  secondsLeft: number;
  deadlineMs: number | null;
  windowMs: number;
  urgent?: boolean;
};

export function AttendanceExpiryRing({
  secondsLeft,
  deadlineMs,
  windowMs,
  urgent = false,
}: AttendanceExpiryRingProps) {
  const progress = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (deadlineMs == null || windowMs <= 0) {
      progress.setValue(1);
      return;
    }

    const msLeft = Math.max(0, deadlineMs - Date.now());
    progress.setValue(Math.min(1, msLeft / windowMs));

    if (msLeft === 0) return;

    const drain = Animated.timing(progress, {
      toValue: 0,
      duration: msLeft,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    drain.start();
    return () => drain.stop();
  }, [deadlineMs, windowMs, progress]);

  useEffect(() => {
    if (!urgent) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(1);
    };
  }, [urgent, pulse]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale: pulse }] }]}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={ATTENDANCE_COLORS.divider}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={urgent ? ATTENDANCE_COLORS.urgent : ATTENDANCE_COLORS.accent}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          originX={RING_SIZE / 2}
          originY={RING_SIZE / 2}
          rotation={-90}
        />
      </Svg>
      <Text style={[styles.value, urgent && styles.valueUrgent]}>
        {secondsLeft}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 15,
    fontWeight: "800",
    color: ATTENDANCE_COLORS.accent,
    fontVariant: ["tabular-nums"],
  },
  valueUrgent: {
    color: ATTENDANCE_COLORS.urgent,
  },
});
