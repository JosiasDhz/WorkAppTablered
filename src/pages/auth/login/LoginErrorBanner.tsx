import React from "react";
import { View, Text, Animated } from "react-native";

type Props = {
  message: string | null;
  shakeX: Animated.Value;
};

export function LoginErrorBanner({ message, shakeX }: Props) {
  return (
    <Animated.View
      style={{
        transform: [{ translateX: shakeX }],
        width: "100%",
      }}
    >
      {message ? (
        <View className="mt-4 rounded-xl px-3 py-2.5 bg-tableAccentRed/10 border border-tableAccentRed/20">
          <Text className="text-tableAccentRed text-center text-sm font-medium">
            {message}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}
