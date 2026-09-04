import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  View,
  LayoutChangeEvent,
  StyleSheet,
} from "react-native";
import { CommonActions, TabActions } from "@react-navigation/native";
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { TAB_BAR_LAYOUT, tabBarShadow, tabBarSurfaceForScheme } from "./tabBarConstants";
import { TabBarNavButton } from "./TabBarNavButton";
import { useTabBarMotion } from "./TabBarMotionContext";
import {
  CafePillTab,
  CafeProfileOrb,
  CafeTabIcons,
} from "./tabBarRouteIcons";
import { useAppAppearance } from "../../theme/appearance";

const PILL_PAD = 6;
const TAB_COUNT = 3;
const easeOut = Easing.out(Easing.cubic);

const TAB_ROOT_SCREEN: Record<string, string> = {
  ProfileStack: "Profile",
  CheckInStack: "QRCode",
  UserProfileStack: "UserProfileMain",
};

function popTabStackToRoot(
  navigation: BottomTabBarProps["navigation"],
  state: BottomTabBarProps["state"],
  tabName: string,
): boolean {
  const tabRoute = state.routes.find((route) => route.name === tabName);
  const stackState = tabRoute?.state;
  if (!stackState || typeof stackState.index !== "number" || stackState.index <= 0) {
    return false;
  }
  const rootScreen = TAB_ROOT_SCREEN[tabName] ?? stackState.routes[0]?.name;
  if (!rootScreen) return false;
  navigation.dispatch(
    CommonActions.navigate({
      name: tabName,
      params: { screen: rootScreen },
    }),
  );
  return true;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function MagnifySlot({
  level,
  children,
}: {
  level: "idle" | "focused" | "hot";
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const to = level === "hot" ? 1.28 : level === "focused" ? 1.08 : 1;
    Animated.timing(scale, {
      toValue: to,
      duration: 140,
      easing: easeOut,
      useNativeDriver: true,
    }).start();
  }, [level, scale]);

  return (
    <Animated.View style={[styles.magnify, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

export function GlassTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const setTabBarHeight = React.useContext(BottomTabBarHeightCallbackContext);
  const { collapsed } = useTabBarMotion();
  const { scheme } = useAppAppearance();
  const pillSurface = tabBarSurfaceForScheme(scheme);
  const tabAnim = useRef(new Animated.Value(1)).current;
  const indicatorX = useRef(new Animated.Value(0)).current;
  const lupa = useRef(new Animated.Value(0)).current;
  const indicatorReady = useRef(false);
  const draggingRef = useRef(false);
  const pendingIndexRef = useRef<number | null>(null);
  const pillOffset = useRef({ x: 0, w: 0 });
  const hitRef = useRef<View>(null);
  const metricsRef = useRef({ trackW: 0, slotW: 0, pillIndex: 0 });
  const [trackW, setTrackW] = useState(0);
  const [hotIndex, setHotIndex] = useState<number | null>(null);

  const focusedName = state.routes[state.index]?.name;
  const pillIndex =
    focusedName === "ProfileStack"
      ? 0
      : focusedName === "CheckInStack"
        ? 1
        : focusedName === "NotificationsStack"
          ? 2
          : -1;

  const slotW = trackW > 0 ? (trackW - PILL_PAD * 2) / TAB_COUNT : 0;
  const indicatorH = TAB_BAR_LAYOUT.profileCircle - PILL_PAD * 2;
  metricsRef.current = { trackW, slotW, pillIndex };

  const slotLeft = useCallback((index: number, width: number, slot: number) => {
    return PILL_PAD + index * slot;
  }, []);

  const indexFromLocalX = useCallback((localX: number) => {
    const w = pillOffset.current.w || metricsRef.current.trackW;
    if (w <= 0) return 0;
    return clamp(Math.floor(localX / (w / TAB_COUNT)), 0, TAB_COUNT - 1);
  }, []);

  const followFinger = useCallback(
    (localX: number) => {
      const w = pillOffset.current.w || metricsRef.current.trackW;
      const slot = metricsRef.current.slotW || (w > 0 ? (w - PILL_PAD * 2) / TAB_COUNT : 0);
      if (w <= 0 || slot <= 0) return;
      const left = clamp(localX - slot / 2, -12, w - slot + 12);
      indicatorX.setValue(left);
    },
    [indicatorX],
  );

  const snapToIndex = useCallback(
    (index: number) => {
      const { slotW: slot } = metricsRef.current;
      if (slot <= 0 || index < 0) return;
      Animated.timing(indicatorX, {
        toValue: slotLeft(index, metricsRef.current.trackW, slot),
        duration: 180,
        easing: easeOut,
        useNativeDriver: true,
      }).start();
    },
    [indicatorX, slotLeft],
  );

  useEffect(() => {
    Animated.timing(tabAnim, {
      toValue: collapsed ? 0 : 1,
      duration: 180,
      easing: easeOut,
      useNativeDriver: true,
    }).start();
  }, [collapsed, tabAnim]);

  useEffect(() => {
    if (draggingRef.current) return;
    if (pendingIndexRef.current != null && pendingIndexRef.current !== pillIndex) {
      return;
    }
    pendingIndexRef.current = null;
    if (trackW <= 0 || slotW <= 0 || pillIndex < 0) return;
    const x = slotLeft(pillIndex, trackW, slotW);
    if (!indicatorReady.current) {
      indicatorX.setValue(x);
      indicatorReady.current = true;
      return;
    }
    snapToIndex(pillIndex);
  }, [indicatorX, pillIndex, slotLeft, slotW, snapToIndex, trackW]);

  const onBarLayout = (e: LayoutChangeEvent) => {
    setTabBarHeight?.(e.nativeEvent.layout.height);
  };

  const onPillLayout = (e: LayoutChangeEvent) => {
    setTrackW(e.nativeEvent.layout.width);
  };

  const onHitLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      pillOffset.current = { ...pillOffset.current, w };
      setTrackW(w);
    }
    hitRef.current?.measureInWindow((x, _y, mw) => {
      if (mw > 0) pillOffset.current = { x, w: mw };
    });
  }, []);

  const activityRoute = state.routes.find((r) => r.name === "ProfileStack");
  const checkInRoute = state.routes.find((r) => r.name === "CheckInStack");
  const noticesRoute = state.routes.find((r) => r.name === "NotificationsStack");
  const userProfileRoute = state.routes.find(
    (r) => r.name === "UserProfileStack",
  );

  const tabNavKey = state.key;

  const navigateTo = useCallback(
    (routeName: string, alreadyFocused: boolean) => {
      if (alreadyFocused) {
        popTabStackToRoot(navigation, state, routeName);
        return;
      }
      navigation.dispatch({
        ...TabActions.jumpTo(routeName),
        target: tabNavKey,
      });
    },
    [navigation, state, tabNavKey],
  );

  const routesRef = useRef({
    names: ["ProfileStack", "CheckInStack", "NotificationsStack"] as const,
    focused: "",
    jump: (_name: string) => {},
    popRoot: (_name: string) => {},
  });
  routesRef.current = {
    names: ["ProfileStack", "CheckInStack", "NotificationsStack"],
    focused: focusedName ?? "",
    jump: (name: string) =>
      navigation.dispatch({
        ...TabActions.jumpTo(name),
        target: tabNavKey,
      }),
    popRoot: (name: string) => {
      popTabStackToRoot(navigation, state, name);
    },
  };

  const showLupa = useCallback(() => {
    Animated.timing(lupa, {
      toValue: 1,
      duration: 120,
      easing: easeOut,
      useNativeDriver: true,
    }).start();
  }, [lupa]);

  const hideLupa = useCallback(() => {
    Animated.timing(lupa, {
      toValue: 0,
      duration: 160,
      easing: easeOut,
      useNativeDriver: true,
    }).start();
  }, [lupa]);

  const gestureRef = useRef({
    indexFromLocalX,
    followFinger,
    snapToIndex,
    showLupa,
    hideLupa,
  });
  gestureRef.current = {
    indexFromLocalX,
    followFinger,
    snapToIndex,
    showLupa,
    hideLupa,
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        draggingRef.current = true;
        pendingIndexRef.current = null;
        const localX = evt.nativeEvent.locationX;
        const { indexFromLocalX: toIndex, followFinger: follow, showLupa: show } =
          gestureRef.current;
        setHotIndex(toIndex(localX));
        follow(localX);
        show();
      },
      onPanResponderMove: (evt) => {
        const localX = evt.nativeEvent.locationX;
        const { indexFromLocalX: toIndex, followFinger: follow } = gestureRef.current;
        follow(localX);
        setHotIndex(toIndex(localX));
      },
      onPanResponderRelease: (evt) => {
        const localX = evt.nativeEvent.locationX;
        const { indexFromLocalX: toIndex, snapToIndex: snap, hideLupa: hide } =
          gestureRef.current;
        const index = toIndex(localX);
        draggingRef.current = false;
        pendingIndexRef.current = index;
        setHotIndex(null);
        snap(index);
        hide();
        const { names, focused, jump, popRoot } = routesRef.current;
        const name = names[index];
        if (!name) return;
        if (name !== focused) jump(name);
        else popRoot(name);
      },
      onPanResponderTerminate: () => {
        draggingRef.current = false;
        pendingIndexRef.current = null;
        setHotIndex(null);
        gestureRef.current.hideLupa();
        const current = metricsRef.current.pillIndex;
        if (current >= 0) gestureRef.current.snapToIndex(current);
      },
    }),
  ).current;

  if (!activityRoute || !checkInRoute || !noticesRoute || !userProfileRoute) {
    return null;
  }

  const focusActivity = focusedName === "ProfileStack";
  const focusCheckIn = focusedName === "CheckInStack";
  const focusNotices = focusedName === "NotificationsStack";
  const focusUserProfile = focusedName === "UserProfileStack";

  const optActivity = descriptors[activityRoute.key].options;
  const optCheckIn = descriptors[checkInRoute.key].options;
  const optNotices = descriptors[noticesRoute.key].options;
  const optUserProfile = descriptors[userProfileRoute.key].options;
  const noticesBadge = optNotices.tabBarBadge;
  const tabScale = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });
  const tabOpacity = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });
  const lupaScale = lupa.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.28],
  });
  const indicatorVisible = pillIndex >= 0 || hotIndex != null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.padded,
          {
            paddingHorizontal: TAB_BAR_LAYOUT.horizontalInset,
            paddingBottom: Math.max(insets.bottom, 8),
            opacity: tabOpacity,
            transform: [{ scale: tabScale }],
          },
        ]}
        pointerEvents="box-none"
        onLayout={onBarLayout}
      >
        <View style={styles.row}>
          <View style={[styles.pillShell, tabBarShadow]}>
            <View style={[styles.pillFill, { backgroundColor: pillSurface }]} />
            <View style={styles.pillInner} onLayout={onPillLayout} pointerEvents="none">
              {slotW > 0 ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.indicatorTrack,
                    {
                      width: slotW,
                      height: indicatorH,
                      opacity: indicatorVisible ? 1 : 0,
                      transform: [
                        { translateX: indicatorX },
                        { scale: lupaScale },
                      ],
                    },
                  ]}
                >
                  <View style={styles.indicatorFill} />
                </Animated.View>
              ) : null}
              <View
                style={styles.pillBtn}
                accessibilityRole="button"
                accessibilityLabel={optActivity.tabBarAccessibilityLabel}
                accessibilityState={focusActivity ? { selected: true } : undefined}
              >
                <MagnifySlot
                  level={hotIndex == null ? (focusActivity ? "focused" : "idle") : hotIndex === 0 ? "hot" : "idle"}
                >
                  <CafePillTab
                    focused={focusActivity || hotIndex === 0}
                    label="Home"
                    Icon={CafeTabIcons.Home}
                  />
                </MagnifySlot>
              </View>
              <View
                style={styles.pillBtn}
                accessibilityRole="button"
                accessibilityLabel={optCheckIn.tabBarAccessibilityLabel}
                accessibilityState={focusCheckIn ? { selected: true } : undefined}
              >
                <MagnifySlot
                  level={hotIndex == null ? (focusCheckIn ? "focused" : "idle") : hotIndex === 1 ? "hot" : "idle"}
                >
                  <CafePillTab
                    focused={focusCheckIn || hotIndex === 1}
                    label="QR"
                    Icon={CafeTabIcons.QR}
                  />
                </MagnifySlot>
              </View>
              <View
                style={styles.pillBtn}
                accessibilityRole="button"
                accessibilityLabel={optNotices.tabBarAccessibilityLabel}
                accessibilityState={focusNotices ? { selected: true } : undefined}
              >
                <MagnifySlot
                  level={hotIndex == null ? (focusNotices ? "focused" : "idle") : hotIndex === 2 ? "hot" : "idle"}
                >
                  <CafePillTab
                    focused={focusNotices || hotIndex === 2}
                    label="Avisos"
                    Icon={CafeTabIcons.Avisos}
                    badge={noticesBadge}
                  />
                </MagnifySlot>
              </View>
            </View>
            <View
              ref={hitRef}
              collapsable={false}
              style={styles.hit}
              onLayout={onHitLayout}
              {...pan.panHandlers}
            />
          </View>
          <TabBarNavButton
            focused={focusUserProfile}
            variant="side"
            pressWash
            accessibilityLabel={optUserProfile.tabBarAccessibilityLabel}
            accessibilityState={
              focusUserProfile ? { selected: true } : undefined
            }
            onPress={() =>
              navigateTo(userProfileRoute.name, focusUserProfile)
            }
            onLongPress={() =>
              navigation.emit({
                type: "tabLongPress",
                target: userProfileRoute.key,
              })
            }
            style={styles.orbBtn}
          >
            <CafeProfileOrb focused={focusUserProfile} />
          </TabBarNavButton>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: "visible",
  },
  padded: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "visible",
    pointerEvents: "box-none",
    zIndex: 50,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: TAB_BAR_LAYOUT.profileCircle,
    gap: TAB_BAR_LAYOUT.pillProfileGap,
    overflow: "visible",
  },
  pillShell: {
    flex: 1,
    height: TAB_BAR_LAYOUT.profileCircle,
    overflow: "visible",
  },
  pillFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TAB_BAR_LAYOUT.profileCircle / 2,
    overflow: "hidden",
  },
  pillInner: {
    flex: 1,
    height: TAB_BAR_LAYOUT.profileCircle,
    overflow: "visible",
    flexDirection: "row",
    alignItems: "stretch",
  },
  indicatorTrack: {
    position: "absolute",
    top: PILL_PAD,
    left: 0,
    zIndex: 1,
    elevation: 10,
  },
  indicatorFill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.28)",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.4)",
  },
  pillBtn: {
    flex: 1,
    zIndex: 2,
    elevation: 12,
    height: "100%",
    alignItems: "stretch",
    justifyContent: "center",
  },
  magnify: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hit: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    elevation: 30,
    backgroundColor: "transparent",
  },
  orbBtn: {
    width: TAB_BAR_LAYOUT.profileCircle,
    height: TAB_BAR_LAYOUT.profileCircle,
    overflow: "visible",
    borderRadius: TAB_BAR_LAYOUT.profileCircle / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
