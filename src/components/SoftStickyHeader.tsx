import React, { useCallback, type ReactNode } from "react";
import { Platform, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

const androidBlur =
  Platform.OS === "android"
    ? {
        experimentalBlurMethod: "dimezisBlurView" as const,
        blurReductionFactor: 2,
      }
    : {};

type SoftStickyHeaderProps = {
  children: ReactNode;
  onBlockHeight?: (height: number) => void;
};

export function SoftStickyHeader({
  children,
  onBlockHeight,
}: SoftStickyHeaderProps) {
  const insets = useSafeAreaInsets();

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onBlockHeight?.(event.nativeEvent.layout.height);
    },
    [onBlockHeight],
  );

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <BlurView
        tint={Platform.OS === "ios" ? "extraLight" : "light"}
        intensity={Platform.OS === "ios" ? 32 : 44}
        {...androidBlur}
        onLayout={onLayout}
        style={[styles.frost, { paddingTop: insets.top }]}
      >
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 4,
  },
  frost: {
    width: "100%",
    backgroundColor: "transparent",
  },
});
