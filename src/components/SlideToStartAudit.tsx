import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { ArrowRight2 } from "iconsax-react-native";

const THUMB = 58;
const H_PAD = 4;
const HINT_GAP = 10;
const HINT_LEFT = H_PAD + THUMB + HINT_GAP;
const THRESHOLD = 0.78;

const COLORS = {
  track: "#EA7600",
  thumb: "#FFFFFF",
  thumbIcon: "#EA7600",
  hint: "rgba(255,255,255,0.95)",
};

type SlideToStartAuditProps = {
  onSlideComplete: () => Promise<void>;
  busy: boolean;
  errorToken?: string | null;
  inDock?: boolean;
  hintText?: string;
};

export function SlideToStartAudit({
  onSlideComplete,
  busy,
  errorToken,
  inDock,
  hintText,
}: SlideToStartAuditProps) {
  const panX = useRef(new Animated.Value(0)).current;
  const trackW = useRef(0);
  const maxSlide = useRef(0);
  const startOffset = useRef(0);
  const completing = useRef(false);
  const lastHapticAt = useRef(0);
  const lastEmitProg = useRef(0);

  const maxForWidth = useCallback((w: number) => Math.max(0, w - H_PAD * 2 - THUMB), []);

  const onTrackLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number } } }) => {
      const w = e.nativeEvent.layout.width;
      trackW.current = w;
      maxSlide.current = maxForWidth(w);
      panX.stopAnimation((v) => {
        const m = maxSlide.current;
        if (v > m) panX.setValue(m);
      });
    },
    [maxForWidth, panX],
  );

  const springTo = useCallback(
    (to: number) =>
      new Promise<void>((resolve) => {
        Animated.spring(panX, {
          toValue: to,
          friction: 8,
          tension: 80,
          useNativeDriver: false,
        }).start(() => resolve());
      }),
    [panX],
  );

  const runComplete = useCallback(async () => {
    if (completing.current || busy) return;
    completing.current = true;
    const m = maxSlide.current;
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise<void>((r) => {
        Animated.timing(panX, {
          toValue: m,
          duration: 140,
          useNativeDriver: false,
        }).start(() => r());
      });
      await onSlideComplete();
    } finally {
      completing.current = false;
      await springTo(0);
    }
  }, [busy, onSlideComplete, panX, springTo]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !busy,
        onMoveShouldSetPanResponder: (_, g) => !busy && Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 4,
        onPanResponderGrant: () => {
          lastHapticAt.current = 0;
          panX.stopAnimation((v) => {
            startOffset.current = v;
            const mx = maxSlide.current;
            lastEmitProg.current = mx > 0 ? v / mx : 0;
          });
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onPanResponderMove: (_, g) => {
          const m = maxSlide.current;
          const next = Math.min(Math.max(0, startOffset.current + g.dx), m);
          panX.setValue(next);
          if (m <= 0 || busy) return;
          const prog = next / m;
          if (prog < lastEmitProg.current) {
            lastEmitProg.current = prog;
            return;
          }
          if (prog - lastEmitProg.current < 0.055) return;
          const now = Date.now();
          const minGap = prog > 0.82 ? 26 : prog > 0.58 ? 36 : prog > 0.32 ? 48 : 62;
          if (now - lastHapticAt.current < minGap) return;
          lastHapticAt.current = now;
          lastEmitProg.current = prog;
          const style =
            prog < 0.34
              ? Haptics.ImpactFeedbackStyle.Light
              : prog < 0.58
                ? Haptics.ImpactFeedbackStyle.Medium
                : prog < 0.8
                  ? Haptics.ImpactFeedbackStyle.Heavy
                  : Haptics.ImpactFeedbackStyle.Rigid;
          void Haptics.impactAsync(style);
        },
        onPanResponderRelease: () => {
          if (busy) return;
          panX.stopAnimation((current) => {
            const m = maxSlide.current;
            if (m <= 0) return;
            if (current >= m * THRESHOLD) {
              void runComplete();
            } else {
              void springTo(0);
            }
          });
        },
        onPanResponderTerminate: () => {
          void springTo(0);
        },
      }),
    [busy, panX, runComplete, springTo],
  );

  useEffect(() => {
    if (errorToken) {
      void springTo(0);
    }
  }, [errorToken, springTo]);

  const hintOpacity = panX.interpolate({
    inputRange: [0, 72, 220],
    outputRange: [1, 0.35, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.wrap, inDock && styles.wrapInDock]}>
      <View style={styles.trackOuter}>
        <View style={styles.track} onLayout={onTrackLayout}>
          <Animated.View
            pointerEvents="none"
            style={[styles.hintBox, { opacity: hintOpacity }]}
          >
            <Text style={styles.hintTxt} numberOfLines={2}>
              {hintText ?? "Desliza para iniciar"}
            </Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.thumb,
              {
                transform: [{ translateX: panX }],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.thumbInner}>
              {busy ? (
                <ActivityIndicator color={COLORS.thumbIcon} size="small" />
              ) : (
                <ArrowRight2 size={22} color={COLORS.thumbIcon} variant="Linear" />
              )}
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14, width: "100%" },
  wrapInDock: { marginTop: 0 },
  trackOuter: {
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.22,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
  track: {
    height: THUMB + H_PAD * 2,
    borderRadius: 999,
    backgroundColor: COLORS.track,
    justifyContent: "center",
    overflow: "hidden",
  },
  hintBox: {
    position: "absolute",
    top: H_PAD,
    bottom: H_PAD,
    left: HINT_LEFT,
    right: H_PAD + 6,
    justifyContent: "center",
    alignItems: "center",
  },
  hintTxt: {
    width: "100%",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.hint,
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  thumb: {
    position: "absolute",
    left: H_PAD,
    top: H_PAD,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: COLORS.thumb,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
