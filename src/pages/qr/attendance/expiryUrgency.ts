import { useEffect } from "react";
import * as Haptics from "expo-haptics";

const ENDING_SECONDS = 5;
const HAPTIC_INTERVAL_MS = 500;

export function isExpiringSoon(secondsLeft: number): boolean {
  return secondsLeft <= ENDING_SECONDS && secondsLeft >= 1;
}

export function useExpiryUrgencyHaptics(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    let step = 0;
    const pulse = () => {
      step += 1;
      if (step % 2 === 1) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        return;
      }
      void Haptics.selectionAsync();
    };

    pulse();
    const id = setInterval(pulse, HAPTIC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [active]);
}
