import React, { useMemo } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { driverRouteGlassBlurBg, driverRouteGlassPanelShell } from "./driverRouteGlass";
import { useDriverUi, type DriverUi } from "./driverUi";

export function RouteGlassPanel(props: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const ui = useDriverUi();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const shell = useMemo(() => driverRouteGlassPanelShell(ui), [ui]);
  const blurBg = useMemo(() => driverRouteGlassBlurBg(ui), [ui]);

  return (
    <View style={[styles.shadow, styles.fill, props.style]}>
      <View style={[shell, styles.fill]}>
        <BlurView
          intensity={Platform.OS === "ios" ? 58 : 72}
          tint={ui.isDark ? "dark" : "light"}
          {...(Platform.OS === "android"
            ? {
                experimentalBlurMethod: "dimezisBlurView" as const,
                blurReductionFactor: 2,
              }
            : {})}
          style={[styles.blur, styles.fill, { backgroundColor: blurBg }]}
        >
          <View style={[styles.inner, styles.fill, props.contentStyle]}>{props.children}</View>
        </BlurView>
      </View>
    </View>
  );
}

function createStyles(ui: DriverUi) {
  return StyleSheet.create({
    fill: {
      flex: 1,
      minHeight: 0,
    },
    shadow: {
      ...Platform.select({
        ios: {
          shadowColor: ui.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: ui.isDark ? 0.4 : 0.14,
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
}
