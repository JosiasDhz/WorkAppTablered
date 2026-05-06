import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

type TabBarMotionContextType = {
  collapsed: boolean;
  onScrollOffset: (y: number) => void;
};

const TabBarMotionContext = createContext<TabBarMotionContextType | null>(null);

export function TabBarMotionProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const lastYRef = useRef(0);

  const onScrollOffset = useCallback((y: number) => {
    const delta = y - lastYRef.current;
    lastYRef.current = y;

    if (y <= 8) {
      if (collapsed) setCollapsed(false);
      return;
    }

    if (delta > 5 && y > 56) {
      if (!collapsed) setCollapsed(true);
      return;
    }

    if (delta < -5) {
      if (collapsed) setCollapsed(false);
    }
  }, [collapsed]);

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

export function useTabBarMotion() {
  const ctx = useContext(TabBarMotionContext);
  if (!ctx) {
    return { collapsed: false, onScrollOffset: (_: number) => undefined };
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
