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
import { Coin, MoneyRecive, TickCircle, Truck } from "iconsax-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { TripMapModel } from "./tripMapModelFromAssignment";
import { buildDriverRouteCelebrationMapHtml } from "./driverRouteCelebrationMapHtml";
import { DriverRouteConfettiLayer } from "./DriverRouteConfettiLayer";
import { useDriverUi, type DriverUi } from "./driverUi";

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

type DriverRouteCompletionCelebrationProps = {
  folio: string;
  deliveredStops: number;
  mapModel: TripMapModel;
  cashPendingMxn?: number;
  commissionEarnedMxn?: number;
  commissionPendingPaymentMxn?: number;
  onFinish: () => void;
};

function formatCashMxn(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n);
}

export function DriverRouteCompletionCelebration({
  folio,
  deliveredStops,
  mapModel,
  cashPendingMxn = 0,
  commissionEarnedMxn = 0,
  commissionPendingPaymentMxn = 0,
  onFinish,
}: DriverRouteCompletionCelebrationProps) {
  const ui = useDriverUi();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const { height: winH } = useWindowDimensions();
  const gradientColors = useMemo(
    () =>
      (ui.isDark
        ? ["transparent", "transparent", "rgba(20, 18, 16, 0.55)", "rgba(20, 18, 16, 0.94)"]
        : ["transparent", "transparent", "rgba(255,255,255,0.55)", "rgba(255,255,255,0.92)"]) as [
        string,
        string,
        string,
        string,
      ],
    [ui.isDark],
  );
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

      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.38, 0.58, 0.75]}
        style={styles.gradient}
        pointerEvents="none"
      />

      <DriverRouteConfettiLayer active />

      <SafeAreaView style={styles.content} edges={["top", "left", "right", "bottom"]}>
        <Animated.View
          style={[
            styles.card,
            {
              maxHeight: Math.min(winH * 0.58, 480),
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
            {cashPendingMxn > 0
              ? "Entregas registradas. Tienes efectivo pendiente."
              : "Todas las entregas quedaron registradas."}
          </Animated.Text>

          {commissionEarnedMxn > 0 ? (
            <Animated.View style={[styles.commissionBanner, { opacity: metaOpacity }]}>
              <Coin size={18} color={ui.green} variant="Bold" />
              <View style={styles.cashBannerCopy}>
                <Text style={styles.commissionBannerAmount}>
                  {formatCashMxn(commissionEarnedMxn)}
                </Text>
                <Text style={styles.commissionBannerHint}>
                  Comisión generada · venta pagada
                </Text>
              </View>
            </Animated.View>
          ) : null}

          {commissionPendingPaymentMxn > 0 ? (
            <Animated.View style={[styles.commissionPendingBanner, { opacity: metaOpacity }]}>
              <Coin size={18} color={ui.amber} variant="Bold" />
              <View style={styles.cashBannerCopy}>
                <Text style={styles.commissionPendingAmount}>
                  {formatCashMxn(commissionPendingPaymentMxn)}
                </Text>
                <Text style={styles.commissionPendingHint}>
                  Se reflejará al realizar el pago · pendiente de cobro
                </Text>
              </View>
            </Animated.View>
          ) : null}

          {cashPendingMxn > 0 ? (
            <Animated.View style={[styles.cashBanner, { opacity: metaOpacity }]}>
              <MoneyRecive size={18} color={ui.amber} variant="Bold" />
              <View style={styles.cashBannerCopy}>
                <Text style={styles.cashBannerAmount}>
                  {formatCashMxn(cashPendingMxn)}
                </Text>
                <Text style={styles.cashBannerHint}>
                  Pendiente de entregar a caja
                </Text>
              </View>
            </Animated.View>
          ) : null}

          <Animated.View style={[styles.metaRow, { opacity: metaOpacity }]}>
            <View style={styles.metaChip}>
              <Truck size={16} color={ui.green} variant="Bold" />
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

function createStyles(ui: DriverUi) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: ui.layout,
    },
    map: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "transparent",
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      flex: 1,
      justifyContent: "flex-end",
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    card: {
      borderRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 20,
      backgroundColor: ui.surface,
      alignItems: "center",
      ...Platform.select({
        ios: {
          shadowColor: ui.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
        },
        android: { elevation: 10 },
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
      backgroundColor: ui.green,
    },
    badge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: ui.green,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: ui.surface,
    },
    title: {
      fontSize: 26,
      fontWeight: "900",
      color: ui.ink,
      letterSpacing: -0.6,
      textAlign: "center",
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: "600",
      color: ui.muted,
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
      backgroundColor: ui.greenSoft,
      borderWidth: 1,
      borderColor: ui.greenBorder,
    },
    metaChipAccent: {
      fontSize: 15,
      fontWeight: "900",
      color: ui.green,
    },
    metaChipText: {
      fontSize: 13,
      fontWeight: "700",
      color: ui.ink,
    },
    finishBtn: {
      width: "100%",
      borderRadius: 16,
      backgroundColor: ui.green,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    finishBtnWaiting: {
      backgroundColor: ui.muted,
    },
    finishBtnText: {
      fontSize: 16,
      fontWeight: "800",
      color: "#FFFFFF",
      letterSpacing: 0.2,
    },
    cashBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      width: "100%",
      marginTop: 14,
      padding: 12,
      borderRadius: 14,
      backgroundColor: ui.amberSoft,
      borderWidth: 1,
      borderColor: ui.amberBorder,
    },
    commissionBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      width: "100%",
      marginTop: 14,
      padding: 12,
      borderRadius: 14,
      backgroundColor: ui.greenSoft,
      borderWidth: 1,
      borderColor: ui.greenBorder,
    },
    cashBannerCopy: {
      flex: 1,
    },
    cashBannerAmount: {
      fontSize: 18,
      fontWeight: "900",
      color: ui.amber,
    },
    cashBannerHint: {
      marginTop: 2,
      fontSize: 12,
      fontWeight: "600",
      color: ui.amber,
    },
    commissionBannerAmount: {
      fontSize: 18,
      fontWeight: "900",
      color: ui.green,
    },
    commissionBannerHint: {
      marginTop: 2,
      fontSize: 12,
      fontWeight: "600",
      color: ui.green,
    },
    commissionPendingBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      width: "100%",
      marginTop: 10,
      padding: 12,
      borderRadius: 14,
      backgroundColor: ui.amberSoft,
      borderWidth: 1,
      borderColor: ui.amberBorder,
    },
    commissionPendingAmount: {
      fontSize: 18,
      fontWeight: "900",
      color: ui.amber,
    },
    commissionPendingHint: {
      marginTop: 2,
      fontSize: 12,
      fontWeight: "600",
      color: ui.amber,
    },
  });
}
