import React, { useCallback, useId, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { SOFT } from "../theme/softUi";

type Box = {
  width: number;
  height: number;
};

export function SoftOrangeGlowBackdrop() {
  const reactId = useId().replace(/:/g, "");
  const topId = `softOrangeGlowTop${reactId}`;
  const bottomId = `softOrangeGlowBottom${reactId}`;
  const [box, setBox] = useState<Box>({ width: 0, height: 0 });

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  }, []);

  return (
    <View pointerEvents="none" style={styles.layer} onLayout={onLayout}>
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
              <Stop offset="0" stopColor="#F3B07A" stopOpacity="0.36" />
              <Stop offset="0.4" stopColor="#F3B07A" stopOpacity="0.16" />
              <Stop offset="0.72" stopColor={SOFT.layout} stopOpacity="0.05" />
              <Stop offset="1" stopColor={SOFT.layout} stopOpacity="0" />
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
              <Stop offset="0" stopColor="#F3B07A" stopOpacity="0.22" />
              <Stop offset="0.4" stopColor="#F3B07A" stopOpacity="0.1" />
              <Stop offset="0.72" stopColor={SOFT.layout} stopOpacity="0.04" />
              <Stop offset="1" stopColor={SOFT.layout} stopOpacity="0" />
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
    backgroundColor: SOFT.layout,
  },
});

export function withSoftOrangeGlow<P extends object>(
  Screen: React.ComponentType<P>,
) {
  const MemoScreen = React.memo(Screen);

  function SoftOrangeGlowScreen(props: P) {
    return (
      <View style={styles.page}>
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
