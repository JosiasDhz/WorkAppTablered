import React, { useMemo } from "react";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { TripMapModel } from "./tripMapModelFromAssignment";
import { buildDriverRouteTripGoogleMapHtml, type MapFitOptions, type MapFitPadding } from "./driverRouteTripGoogleMapHtml";
import { buildDriverRouteCelebrationMapHtml } from "./driverRouteCelebrationMapHtml";

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export type DriverRouteTripMapWebViewProps = {
  model: TripMapModel;
  height?: number;
  fill?: boolean;
  fitPadding?: MapFitPadding;
  mapFitOptions?: MapFitOptions;
  embedded?: boolean;
  celebrationMode?: boolean;
};

export function DriverRouteTripMapWebView({
  model,
  height = 240,
  fill = false,
  fitPadding: fitPaddingProp,
  mapFitOptions,
  embedded = false,
  celebrationMode = false,
}: DriverRouteTripMapWebViewProps) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const fitPaddingAuto = useMemo((): MapFitPadding | undefined => {
    if (!fill) return undefined;
    const sheetRatio = 0.48;
    const swipeReserve = 88;
    return {
      top: Math.max(56, Math.round(insets.top) + 104),
      right: 16,
      bottom: Math.round(winH * sheetRatio + swipeReserve),
      left: 14,
    };
  }, [fill, winH, insets.top]);
  const fitPadding = fill ? (fitPaddingProp ?? fitPaddingAuto) : fitPaddingProp;
  const html = useMemo(() => {
    if (celebrationMode) {
      return buildDriverRouteCelebrationMapHtml(GOOGLE_MAPS_KEY, model, {
        interactive: true,
        fitPadding,
      });
    }
    return buildDriverRouteTripGoogleMapHtml(GOOGLE_MAPS_KEY, model, fitPadding, mapFitOptions);
  }, [celebrationMode, model, fitPadding, mapFitOptions]);
  const source = useMemo(
    () => ({
      html,
      baseUrl: "https://maps.google.com",
    }),
    [html],
  );
  const web = (
    <WebView
      source={source}
      style={styles.web}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
      allowsInlineMediaPlayback
      mixedContentMode="compatibility"
      nestedScrollEnabled
      {...(Platform.OS === "android" ? { androidLayerType: "hardware" as const } : {})}
    />
  );
  if (fill) {
    return (
      <View style={styles.wrapFill} pointerEvents="auto">
        {web}
      </View>
    );
  }
  return <View style={[embedded ? styles.wrapEmbedded : styles.wrap, { height }]}>{web}</View>;
}

const styles = StyleSheet.create({
  wrapFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  wrap: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#f1f5f9",
  },
  wrapEmbedded: {
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
  },
  web: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
