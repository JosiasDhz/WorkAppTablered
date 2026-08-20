import React, { useEffect, useRef } from "react";
import {
  Pressable,
  Animated,
  Easing,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Variant = "side" | "fab";

type Props = {
  focused: boolean;
  variant?: Variant;
  onPress: (e: GestureResponderEvent) => void;
  onLongPress: (e: GestureResponderEvent) => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  pressWash?: boolean;
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean };
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const WASH_STYLE = {
  position: "absolute" as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  borderRadius: 999,
  backgroundColor: "rgba(255,255,255,0.2)",
};

export function TabBarNavButton({
  focused,
  variant = "side",
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  pressWash = false,
  accessibilityLabel,
  accessibilityState,
  children,
  style,
}: Props) {
  const focusScale = useRef(new Animated.Value(1)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const wash = useRef(new Animated.Value(0)).current;
  const isFab = variant === "fab";

  useEffect(() => {
    const to = isFab ? (focused ? 1.06 : 1) : focused ? 1.08 : 1;
    Animated.timing(focusScale, {
      toValue: to,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [focused, isFab, focusScale]);

  const handlePressIn = () => {
    onPressIn?.();
    Animated.parallel([
      Animated.timing(pressScale, {
        toValue: 1.16,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(wash, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    onPressOut?.();
    Animated.parallel([
      Animated.timing(pressScale, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(wash, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      android_ripple={{ color: "transparent" }}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View
        style={
          isFab
            ? { transform: [{ scale: focusScale }, { scale: pressScale }] }
            : {
                flex: 1,
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: focusScale }, { scale: pressScale }],
              }
        }
      >
        {children}
        {pressWash ? (
          <Animated.View
            pointerEvents="none"
            style={[WASH_STYLE, { opacity: wash }]}
          />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}
