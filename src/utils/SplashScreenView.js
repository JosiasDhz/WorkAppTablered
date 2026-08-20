import React from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TableRedColors } from "../theme/tableRedColors";

const LOGO = require("../../assets/splash-logo-arauco.png");
const { width: WINDOW_W, height: WINDOW_H } = Dimensions.get("window");

export default function SplashScreenView() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      <View
        style={[
          styles.loaderWrap,
          { bottom: Math.max(insets.bottom, 24) + WINDOW_H * 0.08 },
        ]}
      >
        <ActivityIndicator size="large" color={TableRedColors.white} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TableRedColors.marron,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: Math.min(WINDOW_W * 0.42, 200),
    height: Math.min(WINDOW_W * 0.42, 200) * (796 / 698),
  },
  loaderWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
