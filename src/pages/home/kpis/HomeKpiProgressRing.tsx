import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { useHomeColors } from "../homeTheme";
import type { HomeKpiTone } from "./HomeKpiCard";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const TICK_COUNT = 48;
const RING_GREEN = "#16A34A";
const TICK_GREEN = "#0F766E";

export type HomeKpiProgressRingProps = {
  progress: number;
  tone: HomeKpiTone;
  label: string;
  caption?: string;
  size?: number;
};

function GaugeTicks({
  cx,
  cy,
  inner,
  outer,
  color,
}: {
  cx: number;
  cy: number;
  inner: number;
  outer: number;
  color: string;
}) {
  const ticks = [];
  for (let i = 0; i < TICK_COUNT; i += 1) {
    const angle = (i / TICK_COUNT) * Math.PI * 2 - Math.PI / 2;
    ticks.push(
      <Line
        key={i}
        x1={cx + inner * Math.cos(angle)}
        y1={cy + inner * Math.sin(angle)}
        x2={cx + outer * Math.cos(angle)}
        y2={cy + outer * Math.sin(angle)}
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />,
    );
  }
  return ticks;
}

export function HomeKpiProgressRing({
  progress,
  label,
  caption,
  size = 112,
}: HomeKpiProgressRingProps) {
  const homeColors = useHomeColors();
  const fill = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, progress));
  const cx = size / 2;
  const tickOuter = size / 2 - 1;
  const tickInner = tickOuter - 7;
  const ringStroke = Math.max(9, Math.round(size * 0.095));
  const ringRadius = tickInner - ringStroke / 2 - 5;
  const circumference = 2 * Math.PI * ringRadius;

  useEffect(() => {
    const anim = Animated.timing(fill, {
      toValue: clamped,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [clamped, fill]);

  const strokeDashoffset = useMemo(
    () =>
      fill.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0],
      }),
    [circumference, fill],
  );

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <GaugeTicks
          cx={cx}
          cy={cx}
          inner={tickInner}
          outer={tickOuter}
          color={TICK_GREEN}
        />
        <Circle
          cx={cx}
          cy={cx}
          r={ringRadius}
          stroke={homeColors.track}
          strokeWidth={ringStroke}
          fill="none"
        />
        <AnimatedCircle
          cx={cx}
          cy={cx}
          r={ringRadius}
          stroke={RING_GREEN}
          strokeWidth={ringStroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          originX={cx}
          originY={cx}
          rotation={-90}
        />
      </Svg>
      <View style={styles.copy}>
        <Text
          style={[
            styles.percent,
            { color: homeColors.ink },
            label.length > 5 ? styles.percentCompact : null,
          ]}
        >
          {label}
        </Text>
        {caption ? (
          <Text style={[styles.caption, { color: RING_GREEN }]} numberOfLines={2}>
            {caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    alignItems: "center",
    paddingHorizontal: 18,
  },
  percent: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
    fontVariant: ["tabular-nums"],
  },
  percentCompact: {
    fontSize: 15,
    letterSpacing: -0.4,
  },
  caption: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
    textAlign: "center",
  },
});
