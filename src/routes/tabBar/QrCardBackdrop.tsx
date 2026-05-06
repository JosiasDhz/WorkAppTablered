import React from "react";
import { Animated, Platform, Pressable, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

export type QrCardBackdropProps = {
  visible: boolean;
  overlayOpacity:
    | Animated.Value
    | Animated.AnimatedInterpolation<number>;
  onRequestClose: () => void;
};

export function QrCardBackdrop({
  visible,
  overlayOpacity,
  onRequestClose,
}: QrCardBackdropProps) {
  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="auto"
      style={[styles.fullscreenOverlay, { opacity: overlayOpacity }]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose}>
        <BlurView
          intensity={Platform.OS === "ios" ? 42 : 54}
          tint="dark"
          {...(Platform.OS === "android"
            ? {
                experimentalBlurMethod: "dimezisBlurView" as const,
                blurReductionFactor: 1,
              }
            : {})}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.overlayDim} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullscreenOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
  overlayDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 12, 18, 0.06)",
  },
});
