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
import { AppState } from "react-native";
import { getFromStorage } from "../utils";
import { refreshAuthSessionOnAppForeground } from "../services/refreshAuthSession";
import { getFile } from "../services/s3Service";
import { restoreSesion } from "../redux/slices/authSlice";
import SplashScreenView from "../utils/SplashScreenView";
import { GlassTabBar } from "./tabBar/GlassTabBar";
import { TabBarMotionProvider } from "./tabBar/TabBarMotionContext";
import Inventory from "../pages/profile/Inventory";
import InventoryAudit from "../pages/profile/InventoryAudit";
import InventoryAuditDetail from "../pages/profile/InventoryAuditDetail";
import InventoryAuditFamilyProducts from "../pages/profile/InventoryAuditFamilyProducts";
import AuditLossDocuments from "../pages/profile/AuditLossDocuments";
import AuditLossDocumentDetail from "../pages/profile/AuditLossDocumentDetail";
import DriverRouteDetailScreen from "../pages/profile/DriverRouteDetailScreen";
import DriverRouteProductPickupScreen from "../pages/profile/DriverRouteProductPickupScreen";
import DriverRouteNavFirstStopScreen from "../pages/profile/DriverRouteNavFirstStopScreen";

const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const tabNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#FFFFFF",
  },
};

const TabNavigator = () => {
  return (
    <TabBarMotionProvider>
      <Tabs.Navigator
        initialRouteName="ProfileStack"
        tabBar={(props) => <GlassTabBar {...props} />}
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
        <Tabs.Screen
          name="ProfileStack"
          options={{ headerTitle: "Actividad" }}
          component={ProfileNavigator}
        />

        <Tabs.Screen
          name="CheckInStack"
          options={{ headerTitle: "Tarjeta" }}
          component={QRCodeNavigator}
        />

        <Tabs.Screen
          name="UserProfileStack"
          options={{ headerTitle: "Perfil" }}
          component={UserProfileNavigator}
        />
      </Tabs.Navigator>
    </TabBarMotionProvider>
  );
};

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = React.useState(true);

  const getData = async () => {
    try {
      const userSaved = await getFromStorage("tablered-user");
      const sellerSaved = await getFromStorage("tablered-seller");
      const tokenSaved = await getFromStorage("tablered-token");
      if (!userSaved || !sellerSaved) return;

      const user = JSON.parse(userSaved);
      const seller = JSON.parse(sellerSaved);
      let profileUrl = null;
      if (user?.avatar?.id) {
        profileUrl = await getFile(user?.avatar?.id);
      }

      dispatch(
        restoreSesion({
          token: tokenSaved,
          user: user,
          seller: seller,
          userAvatar: profileUrl?.url ?? "",
        }),
      );
    } catch {
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    getData();
  }, []);

  React.useEffect(() => {
    if (!token) {
      return;
    }
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        refreshAuthSessionOnAppForeground(dispatch);
      }
    });
    return () => sub.remove();
  }, [token, dispatch]);

  if (loading) {
    return <SplashScreenView />;
  }

  return (
    <NavigationContainer theme={tabNavTheme}>
      <Stack.Navigator
        screenOptions={{
          contentStyle: { flex: 1, backgroundColor: "#FFFFFF" },
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
              component={Inventory}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InventoryAudit"
              component={InventoryAudit}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InventoryAuditDetail"
              component={InventoryAuditDetail}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InventoryAuditFamilyProducts"
              component={InventoryAuditFamilyProducts}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InventoryAuditLossDocuments"
              component={AuditLossDocuments}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InventoryAuditLossDocumentDetail"
              component={AuditLossDocumentDetail}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DriverRouteDetail"
              component={DriverRouteDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DriverRouteProductPickup"
              component={DriverRouteProductPickupScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DriverRouteNavFirstStop"
              component={DriverRouteNavFirstStopScreen}
              options={{ headerShown: false }}
            />
          </React.Fragment>
        ) : ( 
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
