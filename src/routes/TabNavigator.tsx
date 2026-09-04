import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./RootStackParamList";
import QRCodeNavigator from "./navigators/QRCodeNavigator";
import ProfileNavigator from "./navigators/ProfileNavigator";
import UserProfileNavigator from "./navigators/UserProfileNavigator";
import Login from "../pages/auth/Login";
import { RootState } from "../redux/store/store";
import { useDispatch, useSelector } from "react-redux";
import {
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import React from "react";
import { AppState, Platform } from "react-native";
import { refreshAuthSessionOnAppForeground } from "../services/refreshAuthSession";
import { restoreStoredSession } from "../services/restoreStoredSession";
import { useInAppUnreadBadge } from "../services/inAppUnreadBadge";
import SplashScreenView from "../utils/SplashScreenView";
import { GlassTabBar } from "./tabBar/GlassTabBar";
import { TabBarMotionProvider } from "./tabBar/TabBarMotionContext";
import { createIosNativeTabNavigator } from "./tabBar/createIosNativeTabNavigator";
import { withSoftOrangeGlow } from "../components/SoftOrangeGlowBackdrop";
import NotificationsNavigator from "./navigators/NotificationsNavigator";
import Inventory from "../pages/profile/Inventory";
import InventoryAudit from "../pages/profile/InventoryAudit";
import InventoryAuditDetail from "../pages/profile/InventoryAuditDetail";
import InventoryAuditFamilyProducts from "../pages/profile/InventoryAuditFamilyProducts";
import AuditLossDocuments from "../pages/profile/AuditLossDocuments";
import AuditLossDocumentDetail from "../pages/profile/AuditLossDocumentDetail";
import DriverRouteDetailScreen from "../pages/profile/DriverRouteDetailScreen";
import DriverRouteConfirmMercanciaScreen from "../pages/profile/DriverRouteConfirmMercanciaScreen";
import DriverRouteReportIncidentScreen from "../pages/profile/DriverRouteReportIncidentScreen";
import DriverRouteProductPickupScreen from "../pages/profile/DriverRouteProductPickupScreen";
import DriverRouteNavFirstStopScreen from "../pages/profile/DriverRouteNavFirstStopScreen";
import DriverCollectionsScreen from "../pages/profile/DriverCollectionsScreen";
import { useAppAppearance } from "../theme/appearance";
import { navigationRef } from "../navigation/navigationRef";
import { useOpenNotificationFromPush } from "../pages/notifications/useOpenNotificationFromPush";

const JsTabs = createBottomTabNavigator();
const NativeTabs = createIosNativeTabNavigator({
  ProfileStack: { sf: "house", selected: "house.fill" },
  CheckInStack: { sf: "qrcode", selected: "qrcode" },
  NotificationsStack: { sf: "bell", selected: "bell.fill" },
  UserProfileStack: {
    sf: "person",
    selected: "person.fill",
    systemItem: "search",
  },
});
const Stack = createNativeStackNavigator<RootStackParamList>();
const GlowInventory = withSoftOrangeGlow(Inventory);
const GlowInventoryAudit = withSoftOrangeGlow(InventoryAudit);
const GlowInventoryAuditDetail = withSoftOrangeGlow(InventoryAuditDetail);
const GlowInventoryAuditFamilyProducts = withSoftOrangeGlow(
  InventoryAuditFamilyProducts,
);
const GlowAuditLossDocuments = withSoftOrangeGlow(AuditLossDocuments);
const GlowAuditLossDocumentDetail = withSoftOrangeGlow(AuditLossDocumentDetail);
const GlowDriverRouteDetail = withSoftOrangeGlow(DriverRouteDetailScreen);
const GlowDriverRouteConfirmMercancia = withSoftOrangeGlow(
  DriverRouteConfirmMercanciaScreen,
);
const GlowDriverRouteProductPickup = withSoftOrangeGlow(
  DriverRouteProductPickupScreen,
);
const GlowDriverRouteNavFirstStop = withSoftOrangeGlow(
  DriverRouteNavFirstStopScreen,
);
const GlowDriverRouteReportIncident = withSoftOrangeGlow(
  DriverRouteReportIncidentScreen,
);
const GlowDriverCollections = withSoftOrangeGlow(DriverCollectionsScreen);
const GlowLogin = withSoftOrangeGlow(Login);

const TabNavigator = () => {
  const unreadBadge = useInAppUnreadBadge();
  const noticesBadge = unreadBadge > 0 ? unreadBadge : undefined;
  const { colors } = useAppAppearance();

  if (Platform.OS === "ios") {
    return (
      <TabBarMotionProvider>
        <NativeTabs.Navigator
          initialRouteName="ProfileStack"
          screenOptions={{ headerShown: false }}
        >
          <NativeTabs.Screen
            name="ProfileStack"
            options={{ title: "Home" }}
            component={ProfileNavigator}
          />
          <NativeTabs.Screen
            name="CheckInStack"
            options={{ title: "QR" }}
            component={QRCodeNavigator}
          />
          <NativeTabs.Screen
            name="NotificationsStack"
            options={{ title: "Avisos", tabBarBadge: noticesBadge }}
            component={NotificationsNavigator}
          />
          <NativeTabs.Screen
            name="UserProfileStack"
            options={{ title: "Perfil" }}
            component={UserProfileNavigator}
          />
        </NativeTabs.Navigator>
      </TabBarMotionProvider>
    );
  }

  return (
    <TabBarMotionProvider>
      <JsTabs.Navigator
        initialRouteName="ProfileStack"
        tabBar={(props) => <GlassTabBar {...props} />}
        sceneContainerStyle={{ backgroundColor: colors.layout }}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            height: 0,
          },
        }}
      >
        <JsTabs.Screen
          name="ProfileStack"
          options={{ headerTitle: "Home" }}
          component={ProfileNavigator}
        />
        <JsTabs.Screen
          name="CheckInStack"
          options={{ headerTitle: "QR" }}
          component={QRCodeNavigator}
        />
        <JsTabs.Screen
          name="NotificationsStack"
          options={{ headerTitle: "Avisos", tabBarBadge: noticesBadge }}
          component={NotificationsNavigator}
        />
        <JsTabs.Screen
          name="UserProfileStack"
          options={{ headerTitle: "Perfil" }}
          component={UserProfileNavigator}
        />
      </JsTabs.Navigator>
    </TabBarMotionProvider>
  );
};

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = React.useState(true);
  const { colors, scheme } = useAppAppearance();
  useOpenNotificationFromPush(Boolean(token) && !loading);

  const navTheme = React.useMemo(
    () => ({
      ...DefaultTheme,
      dark: scheme === "dark",
      colors: {
        ...DefaultTheme.colors,
        background: colors.layout,
        card: colors.surface,
        text: colors.ink,
        border: colors.border,
        primary: colors.accent,
      },
    }),
    [colors, scheme],
  );

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await restoreStoredSession(dispatch);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  React.useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active" || !token) return;
      refreshAuthSessionOnAppForeground(dispatch);
    });
    return () => sub.remove();
  }, [token, dispatch]);

  if (loading) {
    return <SplashScreenView />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          contentStyle: { flex: 1, backgroundColor: colors.layout },
        }}
      >
        {token ? (
          <React.Fragment>
            <Stack.Screen
            name="Tabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
              name="Inventory"
              component={GlowInventory}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InventoryAudit"
              component={GlowInventoryAudit}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InventoryAuditDetail"
              component={GlowInventoryAuditDetail}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InventoryAuditFamilyProducts"
              component={GlowInventoryAuditFamilyProducts}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InventoryAuditLossDocuments"
              component={GlowAuditLossDocuments}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InventoryAuditLossDocumentDetail"
              component={GlowAuditLossDocumentDetail}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DriverRouteDetail"
              component={GlowDriverRouteDetail}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DriverRouteConfirmMercancia"
              component={GlowDriverRouteConfirmMercancia}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DriverRouteProductPickup"
              component={GlowDriverRouteProductPickup}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DriverRouteNavFirstStop"
              component={GlowDriverRouteNavFirstStop}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DriverRouteReportIncident"
              component={GlowDriverRouteReportIncident}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DriverCollections"
              component={GlowDriverCollections}
              options={{ headerShown: false }}
            />
          </React.Fragment>
        ) : ( 
          <Stack.Screen
            name="Login"
            component={GlowLogin}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
