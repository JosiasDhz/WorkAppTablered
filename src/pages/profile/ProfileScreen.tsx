import React from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Logout } from "iconsax-react-native";
import { ProfileScreenProps } from "../../interfaces/ProfileScreenProps";
import { clearStorage } from "../../utils";
import { logout } from "../../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store/store";
import { useNavigation } from "@react-navigation/native";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { isWorkerDriver } from "../../auth/isWorkerDriver";
import { useDriverPendingRoutes } from "./hooks/useDriverPendingRoutes";
import { ProfileWorkerActivityPanel } from "./components/ProfileWorkerActivityPanel";
import { DriverAssignedRoutesHub } from "./components/DriverAssignedRoutesHub";
import { profileActividadStyles as pa } from "./profileActividadStyles";

const FALLBACK_AVATAR = require("../../../assets/icon.png");
const PROFILE_AVATAR = require("../../../assets/images/profileJos.jpeg");

const activityData = [
  { id: "act-001", folio: "TR-24001", points: 120, sucursal: "Los Rios", date: "Hoy, 10:34 AM" },
  { id: "act-002", folio: "TR-23988", points: 90, sucursal: "5 senores", date: "Ayer, 06:12 PM" },
  { id: "act-003", folio: "TR-23974", points: 150, sucursal: "Madero", date: "Ayer, 01:05 PM" },
  { id: "act-004", folio: "TR-23940", points: 110, sucursal: "Xoxo 1", date: "Lun, 04:48 PM" },
  { id: "act-005", folio: "TR-23912", points: 80, sucursal: "Xoxo 2", date: "Lun, 11:22 AM" },
  { id: "act-006", folio: "TR-23890", points: 140, sucursal: "Etla", date: "Dom, 03:15 PM" },
];

const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { user, seller, userAvatar } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<any>();
  const isDriver = isWorkerDriver(user);
  const routesState = useDriverPendingRoutes(isDriver);

  const colors = {
    bg: "#EEECE6",
    hero: "#2F5E2D",
    heroSoft: "#3E6F3B",
    heroAccent: "#50834C",
    brandOrange: "#EA7600",
    coffee: "#6D5C4C",
    white: "#FFFFFF",
    text: "#0F172A",
    muted: "#64748B",
    border: "#E2E8F0",
    success: "#50834C",
  };

  const handleLogout = async () => {
    await clearStorage();
    dispatch(logout());
  };

  const totalPointsEarned = activityData.reduce((sum, item) => sum + item.points, 0);
  const todayPoints = activityData
    .filter((x) => x.date.toLowerCase().includes("hoy"))
    .reduce((sum, x) => sum + x.points, 0);

  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();
  const userName = user?.name || seller?.name || "Usuario";
  const avatarSource = userAvatar ? { uri: userAvatar } : PROFILE_AVATAR || FALLBACK_AVATAR;

  if (isDriver) {
    return (
      <DriverAssignedRoutesHub
        userName={userName}
        avatarSource={avatarSource}
        onLogout={handleLogout}
        routes={routesState}
        onScroll={onAutoTabBarScroll}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onAutoTabBarScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: Math.max(tabBarHeight, 136) + 24,
        }}
      >
        <View style={pa.screenPad}>
          <View style={[pa.heroCard, { backgroundColor: colors.hero }]}>
            <View style={[pa.heroGlowOne, { backgroundColor: "#0E4E48" }]} />
            <View style={[pa.heroGlowTwo, { backgroundColor: "#50834C66" }]} />

            <View style={pa.heroTopRow}>
              <View style={pa.heroUserRow}>
                <Image
                  style={pa.avatar}
                  source={avatarSource}
                />
                <View style={{ marginLeft: 8 }}>
                  <Text style={pa.heroCaption}>ACTIVIDAD</Text>
                  <Text style={pa.heroUserName}>{userName}</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleLogout}
                style={pa.heroIconButton}
              >
                <Logout size={16} color="#E2F9F1" variant="Linear" />
              </TouchableOpacity>
            </View>

            <View style={pa.balanceWrap}>
              <Text style={[pa.balanceTrend, { color: colors.heroAccent }]}>
                +{todayPoints} puntos hoy
              </Text>
              <Text style={pa.balanceValue}>{totalPointsEarned}</Text>
              <Text style={pa.balanceLabel}>Puntos acumulados</Text>
            </View>

            <View style={pa.heroPillsRow}>
              <View style={pa.heroPill}>
                <Text style={pa.heroPillText}>Movimientos</Text>
              </View>
              <View style={pa.heroPill}>
                <Text style={pa.heroPillText}>Semana actual</Text>
              </View>
            </View>
          </View>

          <ProfileWorkerActivityPanel colors={colors} navigation={navigation} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
