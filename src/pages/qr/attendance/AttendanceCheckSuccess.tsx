import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { TickCircle } from "iconsax-react-native";
import { DriverRouteConfettiLayer } from "../../profile/driverRoute/DriverRouteConfettiLayer";
import { useAttendanceColors } from "./attendanceTheme";

export type AttendanceCheckSuccessProps = {
  warehouseName: string;
};

export function AttendanceCheckSuccess({
  warehouseName,
}: AttendanceCheckSuccessProps) {
  const colors = useAttendanceColors();
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeRotate = useRef(new Animated.Value(-18)).current;
  const copyOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    badgeScale.setValue(0);
    badgeOpacity.setValue(0);
    badgeRotate.setValue(-18);
    copyOpacity.setValue(0);

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
      Animated.spring(badgeRotate, {
        toValue: 0,
        friction: 6,
        tension: 90,
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
  }, [badgeScale, badgeOpacity, badgeRotate, copyOpacity, warehouseName]);

  return (
    <View style={styles.stage}>
      <DriverRouteConfettiLayer active pieceCount={18} fallDistance={280} />
      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: badgeOpacity,
            transform: [
              { scale: badgeScale },
              {
                rotate: badgeRotate.interpolate({
                  inputRange: [-18, 0],
                  outputRange: ["-18deg", "0deg"],
                }),
              },
            ],
          }}
        >
          <View style={[styles.badge, { backgroundColor: colors.success }]}>
            <TickCircle size={64} color={colors.surface} variant="Bold" />
          </View>
        </Animated.View>
        <Animated.View style={[styles.copy, { opacity: copyOpacity }]}>
          <Text style={[styles.title, { color: colors.successInk }]}>
            ¡Chequeo exitoso!
          </Text>
          <Text style={[styles.subtitle, { color: colors.ink }]}>
            {warehouseName}
          </Text>
          <Text style={[styles.hint, { color: colors.success }]}>
            Generando nuevo QR…
          </Text>
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
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  hint: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
