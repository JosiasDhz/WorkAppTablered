import React, { useEffect, useRef, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { playTapFeedback } from "../feedback/tapFeedback";

type SoftPressableProps = {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  disabled?: boolean;
  feedback?: boolean;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: "button";
};

export function SoftPressable({
  children,
  onPress,
  onLongPress,
  delayLongPress,
  disabled,
  feedback = true,
  scaleTo = 0.97,
  style,
  accessibilityLabel,
  accessibilityRole = "button",
}: SoftPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 8,
    }).start();
  };

  const handlePress = () => {
    if (feedback) playTapFeedback();
    onPress?.();
  };

  const flat = StyleSheet.flatten(style);
  const pressableStyle: ViewStyle = {
    flex: flat?.flex,
    width: flat?.width ?? "100%",
    minHeight: flat?.minHeight,
    alignSelf: "stretch",
  };

  return (
    <Pressable
      disabled={disabled}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={pressableStyle}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function SoftReveal({
  delay = 0,
  children,
  style,
  active = true,
}: {
  delay?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  active?: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!active) {
      opacity.setValue(0);
      translateY.setValue(18);
      scale.setValue(0.96);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(18);
    scale.setValue(0.96);

    const show = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        speed: 14,
        bounciness: 8,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        speed: 16,
        bounciness: 7,
      }),
    ]);
    show.start();
    return () => show.stop();
  }, [active, delay, opacity, scale, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
