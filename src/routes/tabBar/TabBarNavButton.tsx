import React, { useEffect, useRef } from "react";
import {
  Pressable,
  Animated,
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
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean };
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function TabBarNavButton({
  focused,
  variant = "side",
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityState,
  children,
  style,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const isFab = variant === "fab";

  useEffect(() => {
    let to = 1;
    if (isFab) {
      to = focused ? 1.06 : 1;
    } else {
      to = focused ? 1.04 : 0.98;
    }
    Animated.spring(scale, {
      toValue: to,
      friction: 7,
      tension: 220,
      useNativeDriver: true,
    }).start();
  }, [focused, isFab, scale]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      onPress={onPress}
      onLongPress={onLongPress}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
