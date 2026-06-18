import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

type ConfettiPiece = {
  id: number;
  leftPct: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  drift: number;
};

const CONFETTI_COLORS = ["#EA7600", "#10B981", "#FBBF24", "#FFFFFF", "#34D399"];

type DriverRouteConfettiLayerProps = {
  active: boolean;
  pieceCount?: number;
  fallDistance?: number;
};

export function DriverRouteConfettiLayer({
  active,
  pieceCount = 22,
  fallDistance = 520,
}: DriverRouteConfettiLayerProps) {
  const pieces = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: pieceCount }, (_, id) => ({
        id,
        leftPct: 4 + Math.random() * 92,
        delay: Math.random() * 900,
        duration: 2200 + Math.random() * 1400,
        size: 6 + Math.random() * 7,
        color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
        drift: -28 + Math.random() * 56,
      })),
    [pieceCount],
  );
  const anims = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!active) return;
    const loops = anims.map((anim, index) => {
      const piece = pieces[index];
      anim.setValue(0);
      return Animated.loop(
        Animated.sequence([
          Animated.delay(piece.delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: piece.duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
    });
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [active, anims, pieces]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, index) => {
        const progress = anims[index];
        return (
          <Animated.View
            key={piece.id}
            style={[
              styles.confetti,
              {
                left: `${piece.leftPct}%`,
                width: piece.size,
                height: piece.size * 1.35,
                backgroundColor: piece.color,
                opacity: progress.interpolate({
                  inputRange: [0, 0.08, 0.92, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-24, fallDistance],
                    }),
                  },
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, piece.drift],
                    }),
                  },
                  {
                    rotate: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", `${piece.drift > 0 ? 280 : -280}deg`],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  confetti: {
    position: "absolute",
    top: 0,
    borderRadius: 2,
  },
});
