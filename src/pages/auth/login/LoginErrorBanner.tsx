import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { LOGIN_COLORS } from "./constants";

type Props = {
  message: string | null;
  shakeX: Animated.Value;
};

export function LoginErrorBanner({ message, shakeX }: Props) {
  if (!message) return null;

  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ translateX: shakeX }] }]}
    >
      <View style={styles.banner}>
        <Text style={styles.text}>{message}</Text>
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
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.18)",
  },
  text: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: "#BE123C",
  },
});
