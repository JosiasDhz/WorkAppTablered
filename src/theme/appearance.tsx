import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance, useColorScheme } from "react-native";
import { getFromStorage, saveInStorage } from "../utils";
import {
  SOFT_DARK,
  SOFT_LIGHT,
  type SoftPalette,
} from "./softUi";

export type AppearancePreference = "system" | "light" | "dark";
export type ColorScheme = "light" | "dark";

const STORAGE_KEY = "tablered-appearance-preference";

type AppearanceContextValue = {
  preference: AppearancePreference;
  scheme: ColorScheme;
  colors: SoftPalette;
  ready: boolean;
  setPreference: (next: AppearancePreference) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function resolveScheme(
  preference: AppearancePreference,
  system: ColorScheme | null | undefined,
): ColorScheme {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  return system === "dark" ? "dark" : "light";
}

function isPreference(value: string | null): value is AppearancePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] =
    useState<AppearancePreference>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void getFromStorage(STORAGE_KEY).then((raw) => {
      if (!alive) return;
      if (isPreference(raw)) setPreferenceState(raw);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (preference === "system") {
      Appearance.setColorScheme(null);
      return;
    }
    Appearance.setColorScheme(preference);
  }, [preference]);

  const setPreference = useCallback((next: AppearancePreference) => {
    setPreferenceState(next);
    void saveInStorage(STORAGE_KEY, next);
  }, []);

  const scheme = resolveScheme(preference, systemScheme);
  const colors = scheme === "dark" ? SOFT_DARK : SOFT_LIGHT;

  const value = useMemo(
    () => ({
      preference,
      scheme,
      colors,
      ready,
      setPreference,
    }),
    [colors, preference, ready, scheme, setPreference],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    return {
      preference: "system",
      scheme: "light",
      colors: SOFT_LIGHT,
      ready: true,
      setPreference: () => {},
    };
  }
  return ctx;
}
