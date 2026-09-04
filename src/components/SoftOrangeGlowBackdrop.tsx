import React, { useCallback, useId, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useAppAppearance } from "../theme/appearance";

type Box = {
  width: number;
  height: number;
};

export function SoftOrangeGlowBackdrop() {
  const { colors, scheme } = useAppAppearance();
  const reactId = useId().replace(/:/g, "");
  const topId = `softOrangeGlowTop${reactId}`;
  const bottomId = `softOrangeGlowBottom${reactId}`;
  const [box, setBox] = useState<Box>({ width: 0, height: 0 });
  const glow = scheme === "dark" ? "#C86800" : "#F3B07A";
  const topOpacity = scheme === "dark" ? 0.28 : 0.36;
  const bottomOpacity = scheme === "dark" ? 0.18 : 0.22;

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  }, []);

  return (
    <View
      pointerEvents="none"
      style={styles.layer}
      onLayout={onLayout}
    >
      {box.width > 0 ? (
        <Svg width={box.width} height={box.height}>
          <Defs>
            <RadialGradient
              id={topId}
              cx={box.width * 0.78}
              cy={box.height * 0.08}
              rx={box.width * 0.82}
              ry={box.height * 0.58}
              fx={box.width * 0.88}
              fy={box.height * 0.02}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={glow} stopOpacity={topOpacity} />
              <Stop offset="0.4" stopColor={glow} stopOpacity={topOpacity * 0.45} />
              <Stop offset="0.72" stopColor={colors.layout} stopOpacity="0.05" />
              <Stop offset="1" stopColor={colors.layout} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id={bottomId}
              cx={box.width * 0.22}
              cy={box.height * 0.78}
              rx={box.width * 0.85}
              ry={box.height * 0.48}
              fx={box.width * 0.18}
              fy={box.height * 0.86}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={glow} stopOpacity={bottomOpacity} />
              <Stop
                offset="0.4"
                stopColor={glow}
                stopOpacity={bottomOpacity * 0.45}
              />
              <Stop offset="0.72" stopColor={colors.layout} stopOpacity="0.04" />
              <Stop offset="1" stopColor={colors.layout} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect
            width={box.width}
            height={box.height}
            fill={`url(#${topId})`}
          />
          <Rect
            width={box.width}
            height={box.height}
            fill={`url(#${bottomId})`}
          />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  page: {
    flex: 1,
  },
});

export function withSoftOrangeGlow<P extends object>(
  Screen: React.ComponentType<P>,
) {
  const MemoScreen = React.memo(Screen);

  function SoftOrangeGlowScreen(props: P) {
    const { colors } = useAppAppearance();
    return (
      <View style={[styles.page, { backgroundColor: colors.layout }]}>
        <SoftOrangeGlowBackdrop />
        <MemoScreen {...props} />
      </View>
    );
  }
  SoftOrangeGlowScreen.displayName = `withSoftOrangeGlow(${
    Screen.displayName || Screen.name || "Screen"
  })`;
  return SoftOrangeGlowScreen;
}
