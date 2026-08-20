import React, { useCallback, useState } from "react";
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from "react-native";

const FRONT_IMAGE = require("../../../../../assets/images/monedero-card.png");

const NAME_LINE = { left: "39%", top: "58.8%" } as const;
const CODE_LINE = { left: "43.7%", top: "72.4%" } as const;

export type WalletCardFrontProps = {
  memberName: string;
  memberCode: string;
};

export function WalletCardFront({
  memberName,
  memberCode,
}: WalletCardFrontProps) {
  const [width, setWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(Math.round(event.nativeEvent.layout.width));
  }, []);

  const fontSize = Math.max(11, width * 0.037);
  const lift = fontSize * 1.2;

  return (
    <View style={styles.face} onLayout={onLayout}>
      <Image source={FRONT_IMAGE} style={styles.image} resizeMode="cover" />
      {width > 0 ? (
        <React.Fragment>
          <Text
            style={[
              styles.value,
              NAME_LINE,
              {
                fontSize,
                maxWidth: width * 0.55,
                transform: [{ translateY: -lift }],
              },
            ]}
            numberOfLines={1}
          >
            {memberName}
          </Text>
          <Text
            style={[
              styles.value,
              CODE_LINE,
              {
                fontSize,
                maxWidth: width * 0.5,
                transform: [{ translateY: -lift }],
              },
            ]}
            numberOfLines={1}
          >
            {memberCode}
          </Text>
        </React.Fragment>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  value: {
    position: "absolute",
    fontWeight: "700",
    color: "#3F3A36",
    letterSpacing: -0.2,
  },
});
