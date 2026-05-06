import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import Icon from "../../assets/table-red-logo.png";
  
const PARTICLE_COUNT = 14;
// const PARTICLE_COUNT = 30;


const rand = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const PARTICLE_KINDS = ["handlebar", "tire", "moto"];
// Ajusta la velocidad de caída (más alto = más lento)
const FALL_DURATION_MS = { min: 1900, max: 3200 };
const COLOR_POOL = [
  "#E51E2F", // rojo moteros
  "#F43F5E", // rose
  "#FB7185", // pink
  "#F59E0B", // amber
  "#EC4899", // fuchsia
];

export default function SplashScreenView() {
  const { width, height } = Dimensions.get("window");

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, () => ({
        x: rand(12, Math.max(12, width - 36)),
        size: Math.round(rand(16, 30)),
        rotateDir: Math.random() > 0.5 ? 1 : -1,
        kind: pick(PARTICLE_KINDS),
        color: pick(COLOR_POOL),
      })),
    [width]
  );

  const progress = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))
  ).current;

  const runningRef = useRef(true);

  useEffect(() => {
    runningRef.current = true;

    const startOne = (i, initial = false) => {
      if (!runningRef.current) return;

      // Nota: NO mutamos `particles` aquí.
      // Antes se cambiaban x/size/kind/color en cada ciclo, pero como `particles`
      // no dispara re-render, esos cambios pueden "aplicarse" de golpe cuando haya
      // un re-render externo (y se percibe como un brinco).

      progress[i].setValue(0);
      Animated.timing(progress[i], {
        toValue: 1,
        duration: Math.round(rand(FALL_DURATION_MS.min, FALL_DURATION_MS.max)),
        delay: Math.round(initial ? rand(0, 900) + i * 70 : rand(120, 520)),
        easing: Easing.linear,
        isInteraction: false,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && runningRef.current) startOne(i, false);
      });
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) startOne(i, true);

    return () => {
      runningRef.current = false;
      for (let i = 0; i < PARTICLE_COUNT; i++) progress[i].stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, width, height]);

  return (
    <View style={styles.container}>
      <Image source={Icon} style={styles.logo} />
      <ActivityIndicator size="large" color="#686158" style={styles.loader} />
    </View>
  );
}
const windowWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
  },

  bgDecor: {
    ...StyleSheet.absoluteFillObject,
  },

  bgDecorItem: {
    position: "absolute",
    transform: [{ rotate: "-14deg" }],
  },
  bgDecor1: {
    top: -70,
    left: -90,
  },
  bgDecor2: {
    bottom: -80,
    right: -70,
    transform: [{ rotate: "12deg" }],
  },
  bgDecor3: {
    top: 110,
    right: -90,
    transform: [{ rotate: "22deg" }],
  },

  particlesLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  particle: {
    position: "absolute",
    top: 0,
  },

  logo: {
    width: windowWidth * 2,
    height: undefined,
    aspectRatio: 3,
    resizeMode: "contain",
  },

  loader: {
    marginTop: 0,
  },
});
