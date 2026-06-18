import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import type { TripMapModel } from "./tripMapModelFromAssignment";
import { buildDriverRouteNavLiveGoogleMapHtml } from "./buildDriverRouteNavLiveGoogleMapHtml";
import type { MapFitPadding } from "./driverRouteTripGoogleMapHtml";

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const GOOGLE_MAPS_MAP_ID = process.env.EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "";

export type DriverRouteNavLiveMapWebViewRef = {
  setDriverPose(lat: number, lng: number, headingDeg: number | null): void;
  updateNavigation(lat: number, lng: number, headingDeg: number | null): void;
  centerOnUser(lat: number, lng: number, headingDeg?: number | null): void;
  fitRouteOverview(): void;
  bootstrapUserPose(lat: number, lng: number, headingDeg: number | null): void;
  updateRoutePath(path: TripMapModel["path"]): void;
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
  const pathRef = useRef(model.path);

  const html = useMemo(
    () =>
      buildDriverRouteNavLiveGoogleMapHtml(
        GOOGLE_MAPS_KEY,
        { path: [], stops: model.stops },
        fitPadding,
        GOOGLE_MAPS_MAP_ID,
      ),
    [model.stops, fitPadding],
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

  const centerOnUser = useCallback((lat: number, lng: number, headingDeg: number | null = null) => {
    const rot =
      headingDeg != null && Number.isFinite(headingDeg) ? Number(headingDeg).toFixed(1) : "null";
    const js = `try{window.centerOnDriverLocation&&window.centerOnDriverLocation(${Number(lat)},${Number(lng)},false,${rot});}catch(e){};true;`;
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

  const updateRoutePath = useCallback((path: TripMapModel["path"]) => {
    if (path.length < 2) return;
    const payload = encodeURIComponent(
      JSON.stringify(
        path.map((p) => ({
          latitude: p.latitude,
          longitude: p.longitude,
        })),
      ),
    );
    const js = `try{window.__setLiveRoutePath&&window.__setLiveRoutePath(JSON.parse(decodeURIComponent("${payload}")));}catch(e){};true;`;
    webRef.current?.injectJavaScript(js);
  }, []);

  useEffect(() => {
    if (model.path.length < 2) return;
    if (pathRef.current === model.path) return;
    pathRef.current = model.path;
    updateRoutePath(model.path);
  }, [model.path, updateRoutePath]);

  useImperativeHandle(
    ref,
    () => ({
      setDriverPose,
      updateNavigation,
      centerOnUser,
      fitRouteOverview,
      bootstrapUserPose,
      updateRoutePath,
    }),
    [setDriverPose, updateNavigation, centerOnUser, fitRouteOverview, bootstrapUserPose, updateRoutePath],
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
        onLoadEnd={() => {
          pathRef.current = model.path;
          if (model.path.length >= 2) {
            updateRoutePath(model.path);
          }
          onMapLoaded?.();
        }}
        {...(Platform.OS === "android" ? { androidLayerType: "hardware" as const } : {})}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrapFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  web: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
