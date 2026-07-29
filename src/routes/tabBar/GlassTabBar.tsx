import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  View,
  LayoutChangeEvent,
  StyleSheet,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { TAB_BAR_LAYOUT, tabBarShadow } from "./tabBarConstants";
import { TabBarNavButton } from "./TabBarNavButton";
import { useTabBarMotion } from "./TabBarMotionContext";
import {
  SideUserProfileTab,
  SideActivityTab,
  TarjetaFab,
} from "./tabBarRouteIcons";
import { CardQrSheet } from "./cardQr/CardQrSheet";
import { QrCardBackdrop } from "./QrCardBackdrop";
import { useBrightnessBoostWhile } from "./useBrightnessBoostWhile";
import { useQrCardSheetAnimation } from "./useQrCardSheetAnimation";

export function GlassTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const setTabBarHeight = React.useContext(BottomTabBarHeightCallbackContext);
  const { collapsed } = useTabBarMotion();
  const [cardOpen, setCardOpen] = useState(false);
  const { cardAnim, renderCard } = useQrCardSheetAnimation(cardOpen);
  const tabAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [barRowWidth, setBarRowWidth] = useState(0);
  useBrightnessBoostWhile(cardOpen);

  const onBarLayout = (e: LayoutChangeEvent) => {
    setTabBarHeight?.(e.nativeEvent.layout.height);
  };

  const checkInRoute = state.routes.find((r) => r.name === "CheckInStack");
  const userProfileRoute = state.routes.find(
    (r) => r.name === "UserProfileStack",
  );
  const activityRoute = state.routes.find((r) => r.name === "ProfileStack");

  useEffect(() => {
    Animated.spring(tabAnim, {
      toValue: collapsed ? 0 : 1,
      friction: 8,
      tension: 180,
      useNativeDriver: true,
    }).start();
  }, [collapsed, tabAnim]);

  const onBarRowLayout = useCallback((e: LayoutChangeEvent) => {
    setBarRowWidth(e.nativeEvent.layout.width);
  }, []);

  const closeCard = useCallback(() => {
    setCardOpen(false);
  }, []);

  const tabScale = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });
  const tabOpacity = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  const navigateTo = useCallback(
    (routeName: string, routeKey: string, alreadyFocused: boolean) => {
      setCardOpen(false);
      if (alreadyFocused) return;
      const event = navigation.emit({
        type: "tabPress",
        target: routeKey,
        canPreventDefault: true,
      });
      if (!event.defaultPrevented) {
        navigation.dispatch({
          ...CommonActions.navigate({ name: routeName, merge: true }),
          target: state.key,
        });
      }
    },
    [navigation, state.key],
  );

  const longPress = useCallback(
    (routeKey: string) => {
      navigation.emit({ type: "tabLongPress", target: routeKey });
    },
    [navigation],
  );

  if (!checkInRoute || !userProfileRoute || !activityRoute) {
    return null;
  }

  const iCheckIn = state.routes.findIndex((r) => r.name === "CheckInStack");
  const iUserProfile = state.routes.findIndex(
    (r) => r.name === "UserProfileStack",
  );
  const iActivity = state.routes.findIndex((r) => r.name === "ProfileStack");

  const focusCheckIn = state.index === iCheckIn || cardOpen;
  const focusUserProfile = state.index === iUserProfile;
  const focusActivity = state.index === iActivity;

  const optCheckIn = descriptors[checkInRoute.key].options;
  const optUserProfile = descriptors[userProfileRoute.key].options;
  const optActivity = descriptors[activityRoute.key].options;

  const sideTarget = focusUserProfile ? 1 : 0;
  const showSlidePill = focusActivity || focusUserProfile;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: sideTarget,
      friction: 7,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [sideTarget, slideAnim]);

  const PILL_INSET = 18;
  const clusterWidth = barRowWidth > 0
    ? (barRowWidth - TAB_BAR_LAYOUT.fabCenterSlotWidth - TAB_BAR_LAYOUT.innerPaddingH * 2) / 2
    : 0;
  const pillWidth = clusterWidth > 0 ? clusterWidth - PILL_INSET * 2 : 0;
  const pillSlideX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, clusterWidth + TAB_BAR_LAYOUT.fabCenterSlotWidth],
  });

  const overlayOpacity = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <QrCardBackdrop
        visible={renderCard}
        overlayOpacity={overlayOpacity}
        onRequestClose={closeCard}
      />
      {renderCard ? (
        <CardQrSheet progress={cardAnim} onClose={closeCard} />
      ) : null}
      <Animated.View
        style={[
          styles.padded,
          {
            paddingHorizontal: TAB_BAR_LAYOUT.horizontalInset,
            paddingBottom: Math.max(insets.bottom, 0),
            opacity: tabOpacity,
            transform: [{ scale: tabScale }],
          },
        ]}
        pointerEvents="box-none"
        onLayout={onBarLayout}
      >
        <View style={styles.barStack}>
          <View
            style={[
              tabBarShadow,
              {
                borderRadius: TAB_BAR_LAYOUT.pillRadius,
                overflow: "hidden",
              },
            ]}
          >
            <View
              style={{
                borderRadius: TAB_BAR_LAYOUT.pillRadius,
                overflow: "hidden",
                backgroundColor: "#3D3630",
              }}
            >
              <View
                onLayout={onBarRowLayout}
                style={[
                  styles.barRow,
                  {
                    paddingHorizontal: TAB_BAR_LAYOUT.innerPaddingH,
                    paddingTop:
                      TAB_BAR_LAYOUT.barRowPaddingTopExtra +
                      TAB_BAR_LAYOUT.barRowPaddingV,
                    paddingBottom: TAB_BAR_LAYOUT.barRowPaddingV,
                  },
                ]}
              >
                {showSlidePill && pillWidth > 0 ? (
                  <Animated.View
                    style={[
                      styles.slidePill,
                      {
                        width: pillWidth,
                        transform: [{ translateX: pillSlideX }],
                      },
                    ]}
                  />
                ) : null}
                <View style={styles.barCluster}>
                  <TabBarNavButton
                    focused={focusActivity}
                    variant="side"
                    accessibilityLabel={optActivity.tabBarAccessibilityLabel}
                    accessibilityState={
                      focusActivity ? { selected: true } : undefined
                    }
                    onPress={() =>
                      navigateTo(
                        activityRoute.name,
                        activityRoute.key,
                        focusActivity,
                      )
                    }
                    onLongPress={() => longPress(activityRoute.key)}
                  >
                    <SideActivityTab
                      focused={focusActivity}
                      label="Rutas"
                    />
                  </TabBarNavButton>
                </View>

                <View
                  style={{ width: TAB_BAR_LAYOUT.fabCenterSlotWidth }}
                />

                <View style={styles.barCluster}>
                  <TabBarNavButton
                    focused={focusUserProfile}
                    variant="side"
                    accessibilityLabel={
                      optUserProfile.tabBarAccessibilityLabel
                    }
                    accessibilityState={
                      focusUserProfile ? { selected: true } : undefined
                    }
                    onPress={() =>
                      navigateTo(
                        userProfileRoute.name,
                        userProfileRoute.key,
                        focusUserProfile,
                      )
                    }
                    onLongPress={() => longPress(userProfileRoute.key)}
                  >
                    <SideUserProfileTab
                      focused={focusUserProfile}
                      label="Perfil"
                    />
                  </TabBarNavButton>
                </View>
              </View>
            </View>
          </View>

          <View
            style={styles.fabSlot}
            pointerEvents="box-none"
          >
            <TabBarNavButton
              focused={focusCheckIn}
              variant="fab"
              accessibilityLabel={optCheckIn.tabBarAccessibilityLabel}
              accessibilityState={focusCheckIn ? { selected: true } : undefined}
              onPress={() => setCardOpen((open) => !open)}
              onLongPress={() => longPress(checkInRoute.key)}
            >
              <TarjetaFab />
            </TabBarNavButton>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  padded: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "box-none",
    zIndex: 50,
  },
  barStack: {
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 10,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  barCluster: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  slidePill: {
    position: "absolute",
    left: TAB_BAR_LAYOUT.innerPaddingH + 18,
    top: 8,
    bottom: 8,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  fabSlot: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    marginTop: -(TAB_BAR_LAYOUT.fabDiameter / 2),
    alignItems: "center",
    zIndex: 20,
  },
});
