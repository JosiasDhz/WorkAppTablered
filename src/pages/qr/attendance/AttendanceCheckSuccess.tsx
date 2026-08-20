import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { TickCircle } from "iconsax-react-native";
import { DriverRouteConfettiLayer } from "../../profile/driverRoute/DriverRouteConfettiLayer";
import { ATTENDANCE_COLORS } from "./attendanceTheme";

export type AttendanceCheckSuccessProps = {
  warehouseName: string;
};

export function AttendanceCheckSuccess({
  warehouseName,
}: AttendanceCheckSuccessProps) {
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const copyOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const reveal = Animated.parallel([
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 5,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.timing(copyOpacity, {
        toValue: 1,
        duration: 360,
        delay: 180,
        useNativeDriver: true,
      }),
    ]);

    reveal.start();
    return () => reveal.stop();
  }, [badgeScale, badgeOpacity, copyOpacity]);

  return (
    <View style={styles.stage}>
      <DriverRouteConfettiLayer active pieceCount={18} fallDistance={280} />
      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: badgeOpacity,
            transform: [{ scale: badgeScale }],
          }}
        >
          <View style={styles.badge}>
            <TickCircle size={64} color="#FFFFFF" variant="Bold" />
          </View>
        </Animated.View>
        <Animated.View style={[styles.copy, { opacity: copyOpacity }]}>
          <Text style={styles.title}>¡Chequeo exitoso!</Text>
          <Text style={styles.subtitle}>{warehouseName}</Text>
          <Text style={styles.hint}>Generando nuevo QR…</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 2,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: ATTENDANCE_COLORS.success,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    marginTop: 14,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: ATTENDANCE_COLORS.successInk,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: ATTENDANCE_COLORS.ink,
    textAlign: "center",
  },
  hint: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
    color: ATTENDANCE_COLORS.success,
    textAlign: "center",
  },
});
