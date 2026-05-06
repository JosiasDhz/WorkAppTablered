import React from "react";
import { View } from "react-native";
import { LOGIN_COLORS } from "./constants";
import { loginHeroStyles } from "./styles";

type Props = {
  height: number;
  paddingTop: number;
};

/** Franja superior de marca (solo presentación). */
export function LoginHeroBackground({ height, paddingTop }: Props) {
  return (
    <View
      pointerEvents="none"
      style={[
        loginHeroStyles.base,
        {
          height,
          paddingTop,
          backgroundColor: LOGIN_COLORS.warmGrey,
        },
      ]}
    />
  );
}
