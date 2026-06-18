import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";
import { Truck } from "iconsax-react-native";

type DriverRouteInProgressDetailBadgeProps = {
  pendingStops: number;
  deliveredStops: number;
};

export function DriverRouteInProgressDetailBadge({
  pendingStops,
  deliveredStops,
}: DriverRouteInProgressDetailBadgeProps) {
  const enter = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      friction: 6,
      tension: 90,
      useNativeDriver: true,
    }).start();

    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoopRef.current.start();
    return () => pulseLoopRef.current?.stop();
  }, [enter, pulse]);

  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.32, 0.1],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.iconWrap}>
        <Animated.View
          style={[styles.halo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}
        />
        <View style={styles.icon}>
          <Truck size={20} color="#FFFFFF" variant="Bold" />
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Entregas en curso</Text>
        <Text style={styles.sub}>
          {deliveredStops} de {deliveredStops + pendingStops} paradas entregadas
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(234,118,0,0.35)",
    ...Platform.select({
      ios: {
        shadowColor: "#EA7600",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
    }),
  },
  iconWrap: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FB923C",
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EA7600",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: "900",
    color: "#9A3412",
  },
  sub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#C2410C",
  },
});
