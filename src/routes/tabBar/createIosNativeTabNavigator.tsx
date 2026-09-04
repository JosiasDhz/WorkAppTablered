import {
  createNavigatorFactory,
  CommonActions,
  TabActions,
  TabRouter,
  useNavigationBuilder,
  type DefaultNavigatorOptions,
  type ParamListBase,
  type TabActionHelpers,
  type TabNavigationState,
  type TabRouterOptions,
} from "@react-navigation/native";
import {
  BottomTabBarHeightContext,
  type BottomTabNavigationEventMap,
  type BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import React, { useCallback, useMemo } from "react";
import {
  BottomTabs,
  BottomTabsScreen,
} from "react-native-screens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, type NativeSyntheticEvent } from "react-native";
import { TAB_BAR_CAFE, TAB_BAR_CAFE_DARK, TAB_BAR_PRIMARY, TAB_BAR_UNFOCUSED } from "./tabBarConstants";
import { playTapFeedback } from "../../feedback/tapFeedback";
import { useAppAppearance } from "../../theme/appearance";

export type IosNativeTabIcon = {
  sf: string;
  selected?: string;
  systemItem?: "search";
};

const iconCache = new Map<string, { sfSymbolName: string }>();

const TAB_ROOT_SCREEN: Record<string, string> = {
  ProfileStack: "Profile",
  CheckInStack: "QRCode",
  UserProfileStack: "UserProfileMain",
};

function popTabStackToRoot(
  navigation: { dispatch: (action: unknown) => void },
  state: TabNavigationState<ParamListBase>,
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

function nativeTabIcon(
  icon: IosNativeTabIcon | undefined,
  selected: boolean,
) {
  if (!icon) return undefined;
  const sfSymbolName = selected ? icon.selected ?? icon.sf : icon.sf;
  const cached = iconCache.get(sfSymbolName);
  if (cached) return cached;
  const next = { sfSymbolName };
  iconCache.set(sfSymbolName, next);
  return next;
}

type NativeTabOptions = BottomTabNavigationOptions;

type Props = DefaultNavigatorOptions<
  ParamListBase,
  TabNavigationState<ParamListBase>,
  NativeTabOptions,
  BottomTabNavigationEventMap
> &
  TabRouterOptions;

const cafeItem = {
  tabBarItemIconColor: TAB_BAR_UNFOCUSED,
  tabBarItemTitleFontColor: TAB_BAR_UNFOCUSED,
};

const cafeItemSelected = {
  tabBarItemIconColor: TAB_BAR_PRIMARY,
  tabBarItemTitleFontColor: TAB_BAR_PRIMARY,
  tabBarItemTitleFontWeight: "600" as const,
};

function buildCafeAppearance(scheme: "light" | "dark") {
  return {
    tabBarBackgroundColor: scheme === "dark" ? TAB_BAR_CAFE_DARK : TAB_BAR_CAFE,
    tabBarBlurEffect: "none" as const,
    tabBarShadowColor: "transparent",
    stacked: {
      normal: cafeItem,
      selected: cafeItemSelected,
      focused: cafeItemSelected,
    },
    inline: {
      normal: cafeItem,
      selected: cafeItemSelected,
      focused: cafeItemSelected,
    },
    compactInline: {
      normal: cafeItem,
      selected: cafeItemSelected,
      focused: cafeItemSelected,
    },
  };
}

export function createIosNativeTabNavigator(
  icons: Record<string, IosNativeTabIcon>,
) {
  function IosNativeTabNavigator({
    id,
    initialRouteName,
    backBehavior,
    children,
    screenListeners,
    screenOptions,
  }: Props) {
    const insets = useSafeAreaInsets();
    const { colors, scheme } = useAppAppearance();
    const cafeAppearance = useMemo(
      () => buildCafeAppearance(scheme),
      [scheme],
    );
    const screenShellStyle = useMemo(
      () => ({
        flex: 1,
        width: "100%" as const,
        height: "100%" as const,
        backgroundColor: colors.layout,
      }),
      [colors.layout],
    );
    const tabBarHeight = 49 + insets.bottom;
    const { state, descriptors, navigation, NavigationContent } =
      useNavigationBuilder<
        TabNavigationState<ParamListBase>,
        TabRouterOptions,
        TabActionHelpers<ParamListBase>,
        NativeTabOptions,
        BottomTabNavigationEventMap
      >(TabRouter, {
        id,
        initialRouteName,
        backBehavior,
        children,
        screenListeners,
        screenOptions,
      });

    const focusedKey = state.routes[state.index]?.key;

    const onNativeFocusChange = useCallback(
      (event: NativeSyntheticEvent<{ tabKey: string }>) => {
        const next = state.routes.find(
          (route) => route.key === event.nativeEvent.tabKey,
        );
        if (!next) return;
        if (next.key === focusedKey) {
          if (popTabStackToRoot(navigation, state, next.name)) {
            playTapFeedback();
          }
          return;
        }
        playTapFeedback();
        navigation.dispatch(TabActions.jumpTo(next.name));
      },
      [focusedKey, navigation, state],
    );

    return (
      <NavigationContent>
        <BottomTabBarHeightContext.Provider value={tabBarHeight}>
          <BottomTabs
            tabBarTintColor={TAB_BAR_PRIMARY}
            tabBarMinimizeBehavior="never"
            experimentalControlNavigationStateInJS={false}
            onNativeFocusChange={onNativeFocusChange}
          >
            {state.routes.map((route) => {
              const icon = icons[route.name];
              const opts = descriptors[route.key].options;
              const title =
                typeof opts.title === "string"
                  ? opts.title
                  : typeof opts.tabBarLabel === "string"
                    ? opts.tabBarLabel
                    : route.name;
              const badge =
                opts.tabBarBadge === undefined || opts.tabBarBadge === null
                  ? undefined
                  : String(opts.tabBarBadge);
              return (
                <BottomTabsScreen
                  key={route.key}
                  tabKey={route.key}
                  isFocused={route.key === focusedKey}
                  title={title}
                  badgeValue={badge}
                  systemItem={icon?.systemItem}
                  icon={nativeTabIcon(icon, false)}
                  selectedIcon={nativeTabIcon(icon, true)}
                  standardAppearance={cafeAppearance}
                  scrollEdgeAppearance={cafeAppearance}
                >
                  <View style={screenShellStyle}>
                    {descriptors[route.key].render()}
                  </View>
                </BottomTabsScreen>
              );
            })}
          </BottomTabs>
        </BottomTabBarHeightContext.Provider>
      </NavigationContent>
    );
  }

  return createNavigatorFactory<
    TabNavigationState<ParamListBase>,
    NativeTabOptions,
    BottomTabNavigationEventMap,
    typeof IosNativeTabNavigator
  >(IosNativeTabNavigator)();
}
