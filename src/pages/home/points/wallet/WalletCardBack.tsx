import React, { useCallback, useState } from "react";
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from "react-native";

const BACK_IMAGE = require("../../../../../assets/images/puntos-banner.png");

export type WalletCardBackProps = {
  headline: string;
  caption: string;
};

export function WalletCardBack({ headline, caption }: WalletCardBackProps) {
  const [width, setWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(Math.round(event.nativeEvent.layout.width));
  }, []);

  const headlineSize = Math.max(24, width * 0.088);
  const captionSize = Math.max(10, width * 0.033);
  const inset = Math.max(12, width * 0.05);

  return (
    <View style={styles.face} onLayout={onLayout}>
      <Image source={BACK_IMAGE} style={styles.image} resizeMode="cover" />
      {width > 0 ? (
        <View style={[styles.summary, { left: inset, bottom: inset }]}>
          <Text style={[styles.headline, { fontSize: headlineSize }]}>
            {headline}
          </Text>
          <Text style={[styles.caption, { fontSize: captionSize }]}>
            {caption}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E8531F",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  summary: {
    position: "absolute",
    alignItems: "flex-start",
  },
  headline: {
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.8,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(120, 40, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  caption: {
    marginTop: 1,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.78)",
    textShadowColor: "rgba(120, 40, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
});
