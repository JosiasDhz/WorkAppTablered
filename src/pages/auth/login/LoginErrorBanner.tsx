import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useLoginColors } from "./constants";

type Props = {
  message: string | null;
  shakeX: Animated.Value;
};

export function LoginErrorBanner({ message, shakeX }: Props) {
  const colors = useLoginColors();
  if (!message) return null;

  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ translateX: shakeX }] }]}
    >
      <View
        style={[
          styles.banner,
          { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
        ]}
      >
        <Text style={[styles.text, { color: colors.errorText }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginTop: 14,
  },
  banner: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  text: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },
});
