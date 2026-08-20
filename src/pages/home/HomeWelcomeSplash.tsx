import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SoftOrangeGlowBackdrop } from "../../components/SoftOrangeGlowBackdrop";
import { SOFT } from "../../theme/softUi";
import { HOME_COLORS } from "./homeTheme";

type Props = {
  headline: string;
  onFinished: () => void;
};

export function HomeWelcomeSplash({ headline, onFinished }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const enter = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: 14,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 520,
        delay: 120,
        useNativeDriver: true,
      }),
    ]);

    const hold = Animated.delay(1400);

    const exit = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 380,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -12,
        duration: 380,
        useNativeDriver: true,
      }),
    ]);

    const sequence = Animated.sequence([enter, hold, exit]);
    sequence.start(({ finished }) => {
      if (finished) onFinished();
    });

    return () => sequence.stop();
  }, [brandOpacity, onFinished, opacity, translateY]);

  return (
    <Modal
      visible
      animationType="none"
      transparent={false}
      statusBarTranslucent
      presentationStyle="fullScreen"
      onRequestClose={onFinished}
    >
      <View style={styles.root} pointerEvents="none">
        <SoftOrangeGlowBackdrop />
        <Animated.View
          style={[
            styles.copy,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <Animated.Text style={[styles.brand, { opacity: brandOpacity }]}>
            Table Red
          </Animated.Text>
          <Text style={styles.hello}>Bienvenido,</Text>
          <Text style={styles.name} numberOfLines={2}>
            {headline}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SOFT.layout,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    paddingHorizontal: 28,
    alignItems: "center",
  },
  brand: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: HOME_COLORS.accent,
    marginBottom: 14,
  },
  hello: {
    fontSize: 28,
    fontWeight: "700",
    color: HOME_COLORS.muted,
    textAlign: "center",
  },
  name: {
    marginTop: 4,
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: HOME_COLORS.heading,
    textAlign: "center",
  },
});
