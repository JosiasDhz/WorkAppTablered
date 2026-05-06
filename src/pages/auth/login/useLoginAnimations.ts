import { useCallback, useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import type { LoginRowAnimation } from "./types";

const easeOutCubic = Easing.bezier(0.33, 1, 0.68, 1);

const ROW_COUNT = 4;

function createRowAnimations(): LoginRowAnimation[] {
  return Array.from({ length: ROW_COUNT }, () => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(22),
  }));
}

/** Animaciones de entrada en filas + shake de error + escala del botón. */
export function useLoginAnimations(reduceMotion: boolean, error: string | null) {
  const rowAnims = useRef(createRowAnimations()).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const runEntrance = useCallback(() => {
    const d = reduceMotion ? 0 : 1;
    const rowDur = 380 * d;
    const staggerMs = 72 * d;

    rowAnims.forEach((r) => {
      r.opacity.setValue(0);
      r.translateY.setValue(22);
    });

    const rowTweens = rowAnims.map((r) =>
      Animated.parallel([
        Animated.timing(r.opacity, {
          toValue: 1,
          duration: rowDur,
          easing: easeOutCubic,
          useNativeDriver: true,
        }),
        Animated.timing(r.translateY, {
          toValue: 0,
          duration: rowDur,
          easing: easeOutCubic,
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.stagger(staggerMs, rowTweens).start();
  }, [reduceMotion, rowAnims]);

  useEffect(() => {
    runEntrance();
  }, [runEntrance]);

  useEffect(() => {
    if (!error) return;
    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, {
        toValue: 10,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: -10,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 8,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 0,
        duration: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [error, shakeX]);

  const [titleAnim, emailRowAnim, passRowAnim, btnRowAnim] = rowAnims;

  return {
    titleAnim,
    emailRowAnim,
    passRowAnim,
    btnRowAnim,
    shakeX,
    btnScale,
  };
}
