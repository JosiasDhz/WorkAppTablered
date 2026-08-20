import { useEffect, useRef } from "react";
import * as Brightness from "expo-brightness";

export function useBrightnessBoostWhile(active: boolean): void {
  const previousBrightnessRef = useRef<number | null>(null);
  const brightnessRaisedRef = useRef(false);

  useEffect(() => {
    const raiseBrightness = async () => {
      try {
        if (previousBrightnessRef.current === null) {
          previousBrightnessRef.current = await Brightness.getBrightnessAsync();
        }
        const permission = await Brightness.requestPermissionsAsync();
        if (permission.status !== "granted") return;
        await Brightness.setBrightnessAsync(1);
        brightnessRaisedRef.current = true;
      } catch {}
    };

    const restoreBrightness = async () => {
      try {
        if (!brightnessRaisedRef.current) return;
        if (previousBrightnessRef.current !== null) {
          await Brightness.setBrightnessAsync(previousBrightnessRef.current);
        }
      } catch {}
      brightnessRaisedRef.current = false;
      previousBrightnessRef.current = null;
    };

    if (active) {
      void raiseBrightness();
      return;
    }
    void restoreBrightness();
  }, [active]);

  useEffect(
    () => () => {
      if (!brightnessRaisedRef.current || previousBrightnessRef.current === null) {
        return;
      }
      void Brightness.setBrightnessAsync(previousBrightnessRef.current);
    },
    [],
  );
}
