import { useCallback, useRef, useState } from "react";
import { Animated } from "react-native";

const FLIP_TENSION = 12;
const FLIP_FRICTION = 9;

export type CardFlipController = {
  showsFront: boolean;
  flip: () => void;
  frontRotation: Animated.AnimatedInterpolation<string>;
  backRotation: Animated.AnimatedInterpolation<string>;
  frontOpacity: Animated.AnimatedInterpolation<number>;
  backOpacity: Animated.AnimatedInterpolation<number>;
};

export function useCardFlip(startsOnFront = true): CardFlipController {
  const progress = useRef(new Animated.Value(startsOnFront ? 0 : 1)).current;
  const [showsFront, setShowsFront] = useState(startsOnFront);

  const flip = useCallback(() => {
    const next = !showsFront;
    setShowsFront(next);
    Animated.spring(progress, {
      toValue: next ? 0 : 1,
      useNativeDriver: true,
      tension: FLIP_TENSION,
      friction: FLIP_FRICTION,
    }).start();
  }, [progress, showsFront]);

  const frontRotation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backRotation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const frontOpacity = progress.interpolate({
    inputRange: [0, 0.5, 0.5001, 1],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = progress.interpolate({
    inputRange: [0, 0.4999, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  return {
    showsFront,
    flip,
    frontRotation,
    backRotation,
    frontOpacity,
    backOpacity,
  };
}
