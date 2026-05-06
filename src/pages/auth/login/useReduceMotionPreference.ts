import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** A11y: respeta preferencia del sistema (reduce movimiento en animaciones). */
export function useReduceMotionPreference(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  return reduceMotion;
}
