import React, { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const SLIDE_IN_MS = 420;

export type SlideDownRevealProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SlideDownReveal({ children, style }: SlideDownRevealProps) {
  const [height, setHeight] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    setHeight((current) => (current === next ? current : next));
  };

  useEffect(() => {
    if (height <= 0) return;

    translateY.setValue(-height);
    opacity.setValue(1);
    const slide = Animated.timing(translateY, {
      toValue: 0,
      duration: SLIDE_IN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    slide.start();
    return () => slide.stop();
  }, [height, opacity, translateY]);

  return (
    <Animated.View style={[styles.clip, style]}>
      <Animated.View
        onLayout={onLayout}
        style={[styles.content, { opacity, transform: [{ translateY }] }]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
});
