import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import * as Haptics from "expo-haptics";

export type QrCardSheetAnimation = {
  cardAnim: Animated.Value;
  renderCard: boolean;
};

export function useQrCardSheetAnimation(cardOpen: boolean): QrCardSheetAnimation {
  const [renderCard, setRenderCard] = useState(false);
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (cardOpen) {
      void Haptics.selectionAsync();
      setRenderCard(true);
      Animated.spring(cardAnim, {
        toValue: 1,
        friction: 8,
        tension: 170,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setRenderCard(false);
      }
    });
  }, [cardAnim, cardOpen]);

  return { cardAnim, renderCard };
}
