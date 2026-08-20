import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export function useAppIsActive(): boolean {
  const [isActive, setIsActive] = useState(
    () => AppState.currentState === "active",
  );

  useEffect(() => {
    const onChange = (next: AppStateStatus) => setIsActive(next === "active");
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, []);

  return isActive;
}
