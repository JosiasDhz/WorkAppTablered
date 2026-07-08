import React from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { driverRouteGlassBlurBg, driverRouteGlassPanelShell } from "./driverRouteGlass";
import { TableRedColors } from "../../../theme/tableRedColors";

const C = TableRedColors;

export function RouteGlassPanel(props: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.shadow, styles.fill, props.style]}>
      <View style={[driverRouteGlassPanelShell, styles.fill]}>
        <BlurView
          intensity={Platform.OS === "ios" ? 58 : 72}
          tint="light"
          {...(Platform.OS === "android"
            ? {
                experimentalBlurMethod: "dimezisBlurView" as const,
                blurReductionFactor: 2,
              }
            : {})}
          style={[styles.blur, styles.fill, { backgroundColor: driverRouteGlassBlurBg }]}
        >
          <View style={[styles.inner, styles.fill, props.contentStyle]}>{props.children}</View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    minHeight: 0,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: C.marron,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  blur: {
    overflow: "hidden",
  },
  inner: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
