import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ArrowRight2 } from "iconsax-react-native";

const THUMB = 58;
const H_PAD = 4;
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
};

export function SlideToStartAudit({
  onSlideComplete,
  busy,
  errorToken,
  inDock,
}: SlideToStartAuditProps) {
  const panX = useRef(new Animated.Value(0)).current;
  const trackW = useRef(0);
  const maxSlide = useRef(0);
  const startOffset = useRef(0);
  const completing = useRef(false);

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
          panX.stopAnimation((v) => {
            startOffset.current = v;
          });
        },
        onPanResponderMove: (_, g) => {
          const m = maxSlide.current;
          const next = Math.min(Math.max(0, startOffset.current + g.dx), m);
          panX.setValue(next);
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
      <View style={styles.track} onLayout={onTrackLayout}>
        <Animated.Text style={[styles.hint, { opacity: hintOpacity }]} pointerEvents="none">
          Desliza para iniciar
        </Animated.Text>
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
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14, width: "100%" },
  wrapInDock: { marginTop: 0 },
  track: {
    height: THUMB + H_PAD * 2,
    borderRadius: 999,
    backgroundColor: COLORS.track,
    justifyContent: "center",
    overflow: "hidden",
  },
  hint: {
    ...StyleSheet.absoluteFillObject,
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: THUMB + H_PAD * 2 - 4,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.hint,
    letterSpacing: 0.2,
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
