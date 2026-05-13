import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import type { TripMapModel } from "./tripMapModelFromAssignment";
import { buildDriverRouteNavLiveGoogleMapHtml } from "./buildDriverRouteNavLiveGoogleMapHtml";
import type { MapFitPadding } from "./driverRouteTripGoogleMapHtml";

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const DEFAULT_VECTOR_MAP_ID = "e1de796ceeb39e97dfe80867";
const GOOGLE_MAP_ID = (process.env.EXPO_PUBLIC_GOOGLE_MAP_ID ?? DEFAULT_VECTOR_MAP_ID).trim();

export type DriverRouteNavLiveMapWebViewRef = {
  setDriverPose(lat: number, lng: number, headingDeg: number | null): void;
  updateNavigation(lat: number, lng: number, headingDeg: number | null): void;
  centerOnUser(lat: number, lng: number): void;
  fitRouteOverview(): void;
  bootstrapUserPose(lat: number, lng: number, headingDeg: number | null): void;
};

export type DriverRouteNavLiveMapWebViewProps = {
  model: TripMapModel;
  fitPadding?: MapFitPadding;
  onMapLoaded?: () => void;
};

export const DriverRouteNavLiveMapWebView = forwardRef<
  DriverRouteNavLiveMapWebViewRef,
  DriverRouteNavLiveMapWebViewProps
>(function DriverRouteNavLiveMapWebView({ model, fitPadding, onMapLoaded }, ref) {
  const webRef = useRef<WebView>(null);

  const html = useMemo(
    () =>
      buildDriverRouteNavLiveGoogleMapHtml(
        GOOGLE_MAPS_KEY,
        model,
        fitPadding,
        GOOGLE_MAP_ID,
      ),
    [model, fitPadding],
  );

  const source = useMemo(
    () => ({
      html,
      baseUrl: "https://maps.google.com",
    }),
    [html],
  );

  const setDriverPose = useCallback((lat: number, lng: number, headingDeg: number | null) => {
    const rot =
      headingDeg != null && Number.isFinite(headingDeg) ? Number(headingDeg).toFixed(1) : "null";
    const js = `try{window.setDriverPose&&window.setDriverPose(${Number(lat)},${Number(lng)},${rot});}catch(e){};true;`;
    webRef.current?.injectJavaScript(js);
  }, []);

  const updateNavigation = useCallback((lat: number, lng: number, headingDeg: number | null) => {
    const rot =
      headingDeg != null && Number.isFinite(headingDeg) ? Number(headingDeg).toFixed(1) : "null";
    const js = `try{window.updateNavigation&&window.updateNavigation(${Number(lat)},${Number(lng)},${rot});}catch(e){};true;`;
    webRef.current?.injectJavaScript(js);
  }, []);

  const centerOnUser = useCallback((lat: number, lng: number) => {
    const js = `try{window.centerOnDriverLocation&&window.centerOnDriverLocation(${Number(lat)},${Number(lng)});}catch(e){};true;`;
    webRef.current?.injectJavaScript(js);
  }, []);

  const fitRouteOverview = useCallback(() => {
    const js = `try{window.fitEntireRouteOnMap&&window.fitEntireRouteOnMap();}catch(e){};true;`;
    webRef.current?.injectJavaScript(js);
  }, []);

  const bootstrapUserPose = useCallback((lat: number, lng: number, headingDeg: number | null) => {
    const rot =
      headingDeg != null && Number.isFinite(headingDeg) ? Number(headingDeg).toFixed(1) : "null";
    const js = `try{window.__setNavBootstrapPose&&window.__setNavBootstrapPose(${Number(lat)},${Number(lng)},${rot});}catch(e){};true;`;
    webRef.current?.injectJavaScript(js);
  }, []);

  useImperativeHandle(
    ref,
    () => ({ setDriverPose, updateNavigation, centerOnUser, fitRouteOverview, bootstrapUserPose }),
    [setDriverPose, updateNavigation, centerOnUser, fitRouteOverview, bootstrapUserPose],
  );

  return (
    <View style={styles.wrapFill}>
      <WebView
        ref={webRef}
        source={source}
        style={styles.web}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        mixedContentMode="compatibility"
        onLoadEnd={() => onMapLoaded?.()}
        {...(Platform.OS === "android" ? { androidLayerType: "hardware" as const } : {})}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrapFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E8EAED",
  },
  web: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
