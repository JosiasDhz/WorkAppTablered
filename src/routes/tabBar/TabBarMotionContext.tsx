import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

type TabBarMotionContextType = {
  collapsed: boolean;
  onScrollOffset: (y: number) => void;
};

const STATIC_MOTION: TabBarMotionContextType = {
  collapsed: false,
  onScrollOffset: () => undefined,
};

const TabBarMotionContext = createContext<TabBarMotionContextType | null>(null);

function ScrollDrivenMotionProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const lastYRef = useRef(0);
  const collapsedRef = useRef(false);

  const applyCollapsed = useCallback((next: boolean) => {
    if (collapsedRef.current === next) return;
    collapsedRef.current = next;
    setCollapsed(next);
  }, []);

  const onScrollOffset = useCallback(
    (y: number) => {
      const delta = y - lastYRef.current;
      lastYRef.current = y;

      if (y <= 8) {
        applyCollapsed(false);
        return;
      }

      if (delta > 5 && y > 56) {
        applyCollapsed(true);
        return;
      }

      if (delta < -5) {
        applyCollapsed(false);
      }
    },
    [applyCollapsed],
  );

  const value = useMemo(
    () => ({ collapsed, onScrollOffset }),
    [collapsed, onScrollOffset],
  );

  return (
    <TabBarMotionContext.Provider value={value}>
      {children}
    </TabBarMotionContext.Provider>
  );
}

export function TabBarMotionProvider({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "ios") {
    return (
      <TabBarMotionContext.Provider value={STATIC_MOTION}>
        {children}
      </TabBarMotionContext.Provider>
    );
  }

  return <ScrollDrivenMotionProvider>{children}</ScrollDrivenMotionProvider>;
}

export function useTabBarMotion() {
  const ctx = useContext(TabBarMotionContext);
  if (!ctx) {
    return STATIC_MOTION;
  }
  return ctx;
}

export function useTabBarAutoCollapseScroll() {
  const { onScrollOffset } = useTabBarMotion();
  return useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScrollOffset(e.nativeEvent.contentOffset.y);
    },
    [onScrollOffset],
  );
}
