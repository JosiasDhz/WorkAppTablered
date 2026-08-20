import React, { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const FLIP_DURATION_MS = 420;
const START_ANGLE = "-84deg";

export type PageFlipRevealProps = {
  children: ReactNode;
  delay?: number;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PageFlipReveal({
  children,
  delay = 0,
  active = true,
  style,
}: PageFlipRevealProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!active) {
      progress.setValue(0);
      setSettled(false);
      return;
    }

    setSettled(false);
    progress.setValue(0);
    const flip = Animated.timing(progress, {
      toValue: 1,
      duration: FLIP_DURATION_MS,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    flip.start(({ finished }) => {
      if (finished) setSettled(true);
    });
    return () => flip.stop();
  }, [active, delay, progress]);

  const rotateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [START_ANGLE, "0deg"],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.85, 1],
  });

  return (
    <Animated.View
      collapsable={false}
      style={[
        styles.page,
        style,
        settled
          ? styles.settled
          : { opacity, transform: [{ perspective: 900 }, { rotateX }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  page: {
    transformOrigin: "top",
  },
  settled: {
    opacity: 1,
  },
});
