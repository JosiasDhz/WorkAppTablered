import React, { type ReactNode } from "react";
import { Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LOGIN_BLUR } from "./constants";
import { blurSectionStyle } from "./styles";

type Props = {
  children: ReactNode;
};

/** Zona con desenfoque (expo-blur); el botón debe vivir fuera de este árbol. */
export function LoginBlurPanel({ children }: Props) {
  return (
    <BlurView
      intensity={
        Platform.OS === "ios"
          ? LOGIN_BLUR.iosIntensity
          : LOGIN_BLUR.androidIntensity
      }
      tint="light"
      {...(Platform.OS === "android"
        ? {
            experimentalBlurMethod: "dimezisBlurView" as const,
            blurReductionFactor: LOGIN_BLUR.androidBlurReductionFactor,
          }
        : {})}
      style={[
        blurSectionStyle,
        {
          backgroundColor:
            Platform.OS === "ios"
              ? LOGIN_BLUR.overlayIos
              : LOGIN_BLUR.overlayAndroid,
        },
      ]}
    >
      {children}
    </BlurView>
  );
}
