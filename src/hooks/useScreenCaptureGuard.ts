import { useEffect } from "react";
import * as ScreenCapture from "expo-screen-capture";

export function useScreenCaptureGuard(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, [active]);
}
