import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SoftPressable } from "../../../../components/SoftPressable";
import { POINTS_RADIUS, WALLET_CARD_RATIO } from "../pointsTheme";
import { useCardFlip } from "./useCardFlip";
import { WalletCardBack } from "./WalletCardBack";
import { WalletCardFront } from "./WalletCardFront";

export type WalletFlipCardProps = {
  memberName: string;
  memberCode: string;
  headline: string;
  caption: string;
};

export function WalletFlipCard({
  memberName,
  memberCode,
  headline,
  caption,
}: WalletFlipCardProps) {
  const {
    showsFront,
    flip,
    frontRotation,
    backRotation,
    frontOpacity,
    backOpacity,
  } = useCardFlip(false);

  return (
    <SoftPressable
      onPress={flip}
      scaleTo={0.985}
      accessibilityLabel={
        showsFront
          ? "Monedero electrónico, toca para ver el reverso"
          : "Reverso del monedero, toca para ver el frente"
      }
    >
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.faceLayer,
            {
              opacity: frontOpacity,
              transform: [{ perspective: 1200 }, { rotateY: frontRotation }],
            },
          ]}
        >
          <WalletCardFront memberName={memberName} memberCode={memberCode} />
        </Animated.View>
        <Animated.View
          style={[
            styles.faceLayer,
            {
              opacity: backOpacity,
              transform: [{ perspective: 1200 }, { rotateY: backRotation }],
            },
          ]}
        >
          <WalletCardBack headline={headline} caption={caption} />
        </Animated.View>
      </View>
    </SoftPressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: "100%",
    aspectRatio: WALLET_CARD_RATIO,
  },
  faceLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: POINTS_RADIUS.card,
    overflow: "hidden",
    backfaceVisibility: "hidden",
  },
});
