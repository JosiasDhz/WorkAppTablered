import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { TickCircle, Truck } from "iconsax-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { TripMapModel } from "./tripMapModelFromAssignment";
import { buildDriverRouteCelebrationMapHtml } from "./driverRouteCelebrationMapHtml";
import { DriverRouteConfettiLayer } from "./DriverRouteConfettiLayer";

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

type DriverRouteCompletionCelebrationProps = {
  folio: string;
  deliveredStops: number;
  mapModel: TripMapModel;
  onFinish: () => void;
};

export function DriverRouteCompletionCelebration({
  folio,
  deliveredStops,
  mapModel,
  onFinish,
}: DriverRouteCompletionCelebrationProps) {
  const { height: winH } = useWindowDimensions();
  const [canFinish, setCanFinish] = useState(false);
  const backdrop = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(48)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeRotate = useRef(new Animated.Value(-18)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const metaOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const html = useMemo(
    () => buildDriverRouteCelebrationMapHtml(GOOGLE_MAPS_KEY, mapModel),
    [mapModel],
  );
  const webSource = useMemo(
    () => ({ html, baseUrl: "https://maps.google.com" }),
    [html],
  );

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 7,
        tension: 72,
        useNativeDriver: true,
      }),
      Animated.spring(cardY, {
        toValue: 0,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(900),
      Animated.parallel([
        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 5,
          tension: 110,
          useNativeDriver: true,
        }),
        Animated.spring(badgeRotate, {
          toValue: 0,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(metaOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();

    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoopRef.current.start();

    const fallback = setTimeout(() => {
      setCanFinish(true);
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }).start();
    }, 4200);

    return () => {
      clearTimeout(fallback);
      pulseLoopRef.current?.stop();
    };
  }, [backdrop, badgeRotate, badgeScale, buttonOpacity, cardScale, cardY, metaOpacity, pulse, titleOpacity]);

  const revealButton = () => {
    if (canFinish) return;
    setCanFinish(true);
    Animated.timing(buttonOpacity, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  };

  const badgeSpin = badgeRotate.interpolate({
    inputRange: [-18, 0],
    outputRange: ["-18deg", "0deg"],
  });
  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.06],
  });

  return (
    <View style={styles.root}>
      <WebView
        source={webSource}
        style={styles.map}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as { type?: string };
            if (data.type === "celebration-map-done") revealButton();
          } catch {
            revealButton();
          }
        }}
        {...(Platform.OS === "android" ? { androidLayerType: "hardware" as const } : {})}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.backdropTint,
          {
            opacity: backdrop.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.42],
            }),
          },
        ]}
      />

      <LinearGradient
        colors={["rgba(15,23,42,0.05)", "rgba(15,23,42,0.55)", "rgba(15,23,42,0.92)"]}
        locations={[0, 0.45, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />

      <DriverRouteConfettiLayer active />

      <SafeAreaView style={styles.content} edges={["top", "left", "right", "bottom"]}>
        <Animated.View
          style={[
            styles.card,
            {
              maxHeight: Math.min(winH * 0.58, 460),
              opacity: backdrop,
              transform: [{ translateY: cardY }, { scale: cardScale }],
            },
          ]}
        >
          <View style={styles.badgeWrap}>
            <Animated.View
              style={[
                styles.badgeHalo,
                { opacity: haloOpacity, transform: [{ scale: haloScale }] },
              ]}
            />
            <Animated.View
              style={[
                styles.badge,
                { transform: [{ scale: badgeScale }, { rotate: badgeSpin }] },
              ]}
            >
              <TickCircle size={42} color="#FFFFFF" variant="Bold" />
            </Animated.View>
          </View>

          <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
            ¡Ruta completada!
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { opacity: titleOpacity }]}>
            Todas las entregas quedaron registradas.
          </Animated.Text>

          <Animated.View style={[styles.metaRow, { opacity: metaOpacity }]}>
            <View style={styles.metaChip}>
              <Truck size={16} color="#10B981" variant="Bold" />
              <Text style={styles.metaChipText}>{folio}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipAccent}>{deliveredStops}</Text>
              <Text style={styles.metaChipText}>
                {deliveredStops === 1 ? "parada" : "paradas"}
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: buttonOpacity, width: "100%" }}>
            <Pressable
              style={[styles.finishBtn, !canFinish ? styles.finishBtnWaiting : null]}
              onPress={onFinish}
              disabled={!canFinish}
              accessibilityRole="button"
              accessibilityLabel="Volver al inicio"
            >
              <Text style={styles.finishBtnText}>
                {canFinish ? "Volver al inicio" : "Pintando tu ruta…"}
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0F172A",
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#022C22",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    backgroundColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 24,
      },
      android: { elevation: 14 },
    }),
  },
  badgeWrap: {
    width: 92,
    height: 92,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  badgeHalo: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#34D399",
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
    marginBottom: 20,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  metaChipAccent: {
    fontSize: 15,
    fontWeight: "900",
    color: "#059669",
  },
  metaChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  finishBtn: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#10B981",
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  finishBtnWaiting: {
    backgroundColor: "#64748B",
  },
  finishBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
