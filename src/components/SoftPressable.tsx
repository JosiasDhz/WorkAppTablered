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
  accessibilityState?: { selected?: boolean; disabled?: boolean };
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
  accessibilityState,
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

  const flat = StyleSheet.flatten(style) as ViewStyle | undefined;
  const pressableStyle: ViewStyle = {
    flex: flat?.flex,
    width: flat?.width ?? (flat?.flex != null ? undefined : "100%"),
    minHeight: flat?.minHeight,
    alignSelf: flat?.alignSelf ?? (flat?.flex != null ? "stretch" : undefined),
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
      accessibilityState={accessibilityState}
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
  const opacity = useRef(new Animated.Value(active ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(active ? 0 : 18)).current;
  const playedRef = useRef(active);

  useEffect(() => {
    if (!active) return;
    if (playedRef.current) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(18);

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
    ]);
    show.start(({ finished }) => {
      if (finished) playedRef.current = true;
    });
    return () => show.stop();
  }, [active, delay, opacity, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
