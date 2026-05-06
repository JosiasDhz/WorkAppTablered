import React from "react";
import { Pressable, Text, ActivityIndicator, Animated } from "react-native";
import { LOGIN_COLORS, LOGIN_COPY } from "./constants";
import { primaryButtonShadow } from "./styles";
import type { LoginRowAnimation } from "./types";

type Props = {
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
  btnScale: Animated.Value;
  rowAnim: LoginRowAnimation;
};

/** CTA principal fuera del blur para color sólido. */
export function LoginPrimaryButton({
  loading,
  disabled,
  onPress,
  btnScale,
  rowAnim,
}: Props) {
  return (
    <Animated.View
      style={{
        opacity: rowAnim.opacity,
        transform: [{ translateY: rowAnim.translateY }],
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() =>
          Animated.spring(btnScale, {
            toValue: 0.98,
            friction: 5,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(btnScale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }).start()
        }
        className="mt-2"
      >
        <Animated.View
          style={{
            transform: [{ scale: btnScale }],
            opacity: disabled ? 0.45 : 1,
            backgroundColor: LOGIN_COLORS.orange,
            ...primaryButtonShadow,
          }}
          className="h-[54px] rounded-2xl flex-row justify-center items-center"
        >
          <Text className="text-tableWhite text-[17px] font-semibold mr-2">
            {loading ? LOGIN_COPY.submitting : LOGIN_COPY.submit}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
