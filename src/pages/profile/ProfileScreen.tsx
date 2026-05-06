import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Logout, ArrowRight2, Coin } from "iconsax-react-native";
import { BlurView } from "expo-blur";
import { ProfileScreenProps } from "../../interfaces/ProfileScreenProps";
import { clearStorage } from "../../utils";
import { logout } from "../../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store/store";
import { useNavigation } from "@react-navigation/native";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";

const FALLBACK_AVATAR = require("../../../assets/icon.png");
const PROFILE_AVATAR = require("../../../assets/images/profileJos.jpeg");

const filters = [
  { key: "all", label: "Todo" },
  { key: "today", label: "Hoy" },
  { key: "week", label: "7 dias" },
] as const;

const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { user, seller, userAvatar } = useSelector(
    (state: RootState) => state.auth,
  );
  const navigation = useNavigation<any>();
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "week">(
    "all",
  );

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

  const activityData = [
    { id: "act-001", folio: "TR-24001", points: 120, sucursal: "Los Rios", date: "Hoy, 10:34 AM" },
    { id: "act-002", folio: "TR-23988", points: 90, sucursal: "5 senores", date: "Ayer, 06:12 PM" },
    { id: "act-003", folio: "TR-23974", points: 150, sucursal: "Madero", date: "Ayer, 01:05 PM" },
    { id: "act-004", folio: "TR-23940", points: 110, sucursal: "Xoxo 1", date: "Lun, 04:48 PM" },
    { id: "act-005", folio: "TR-23912", points: 80, sucursal: "Xoxo 2", date: "Lun, 11:22 AM" },
    { id: "act-006", folio: "TR-23890", points: 140, sucursal: "Etla", date: "Dom, 03:15 PM" },
  ];

  const totalPointsEarned = activityData.reduce((sum, item) => sum + item.points, 0);
  const todayPoints = activityData
    .filter((x) => x.date.toLowerCase().includes("hoy"))
    .reduce((sum, x) => sum + x.points, 0);

  const filteredActivity = useMemo(() => {
    if (activeFilter === "today") {
      return activityData.filter((x) => x.date.toLowerCase().includes("hoy"));
    }
    if (activeFilter === "week") {
      return activityData.slice(0, 4);
    }
    return activityData;
  }, [activeFilter]);

  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();
  const userName = user?.name || seller?.name || "Usuario";

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
        <View style={styles.screenPad}>
          <View style={[styles.heroCard, { backgroundColor: colors.hero }]}>
            <View style={[styles.heroGlowOne, { backgroundColor: "#0E4E48" }]} />
            <View style={[styles.heroGlowTwo, { backgroundColor: "#50834C66" }]} />

            <View style={styles.heroTopRow}>
              <View style={styles.heroUserRow}>
                <Image
                  style={styles.avatar}
                  source={
                    userAvatar ? { uri: userAvatar } : PROFILE_AVATAR || FALLBACK_AVATAR
                  }
                />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.heroCaption}>ACTIVIDAD</Text>
                  <Text style={styles.heroUserName}>{userName}</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleLogout}
                style={styles.heroIconButton}
              >
                <Logout size={16} color="#E2F9F1" variant="Linear" />
              </TouchableOpacity>
            </View>

            <View style={styles.balanceWrap}>
              <Text style={[styles.balanceTrend, { color: colors.heroAccent }]}>
                +{todayPoints} puntos hoy
              </Text>
              <Text style={styles.balanceValue}>{totalPointsEarned}</Text>
              <Text style={styles.balanceLabel}>Puntos acumulados</Text>
            </View>

            <View style={styles.heroPillsRow}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>Movimientos</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>Semana actual</Text>
              </View>
            </View>
          </View>

          <BlurView
            intensity={Platform.OS === "ios" ? 40 : 55}
            tint="light"
            {...(Platform.OS === "android"
              ? {
                  experimentalBlurMethod: "dimezisBlurView" as const,
                  blurReductionFactor: 1,
                }
              : {})}
            style={styles.sheet}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Transacciones</Text>
              <Text style={[styles.sheetCount, { color: colors.muted }]}>
                {filteredActivity.length} registros
              </Text>
            </View>

            <View style={[styles.filterWrap, { borderColor: colors.border }]}>
              {filters.map((item) => {
                const selected = activeFilter === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.9}
                    onPress={() => setActiveFilter(item.key)}
                    style={[
                      styles.filterButton,
                      selected ? { backgroundColor: colors.brandOrange } : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        { color: selected ? "#FFFFFF" : colors.muted },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {filteredActivity.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate("SaleDetail", {
                    folio: item.folio,
                    points: item.points,
                    sucursal: item.sucursal,
                    date: item.date,
                  })
                }
                style={[styles.rowCard, { borderColor: colors.border }]}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.rowIcon, { backgroundColor: "#FFF1E5" }]}>
                    <Coin size={14} color={colors.brandOrange} variant="Bold" />
                  </View>
                  <View>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>{item.sucursal}</Text>
                    <Text style={[styles.rowSub, { color: colors.muted }]}>Folio {item.folio}</Text>
                  </View>
                </View>

                <View style={styles.rowRight}>
                  <Text style={[styles.rowPoints, { color: colors.success }]}>+{item.points}.00</Text>
                  <Text style={[styles.rowDate, { color: colors.muted }]}>{item.date}</Text>
                </View>
                <ArrowRight2 size={14} color="#94A3B8" variant="Linear" />
              </TouchableOpacity>
            ))}

            {filteredActivity.length === 0 ? (
              <View style={[styles.emptyState, { borderColor: colors.border }]}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No hay movimientos</Text>
                <Text style={[styles.emptySub, { color: colors.muted }]}>
                  Cambia el filtro para ver actividad.
                </Text>
              </View>
            ) : null}
          </BlurView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenPad: {
    paddingHorizontal: 10,
  },
  heroCard: {
    borderRadius: 24,
    padding: 14,
    overflow: "hidden",
  },
  heroGlowOne: {
    position: "absolute",
    right: -60,
    top: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  heroGlowTwo: {
    position: "absolute",
    left: -80,
    bottom: -100,
    width: 230,
    height: 230,
    borderRadius: 115,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroUserRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#FFFFFF88",
  },
  heroCaption: {
    color: "#B6E1D7",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroUserName: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
  },
  heroIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#2A716A",
    backgroundColor: "#0B4C45",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceWrap: {
    marginTop: 12,
    alignItems: "center",
  },
  balanceTrend: {
    fontSize: 14,
    fontWeight: "700",
  },
  balanceValue: {
    marginTop: 2,
    color: "#F8FCFB",
    fontSize: 44,
    fontWeight: "700",
    letterSpacing: -1.2,
  },
  balanceLabel: {
    marginTop: 1,
    color: "#B6D5CF",
    fontSize: 12,
    fontWeight: "500",
  },
  heroPillsRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  heroPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2D746D",
    backgroundColor: "#0A4842",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroPillText: {
    color: "#D1EEE7",
    fontSize: 12,
    fontWeight: "600",
  },
  sheet: {
    marginTop: -18,
    borderRadius: 24,
    backgroundColor: Platform.OS === "ios" ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.65)",
    padding: 14,
    overflow: "hidden",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 29 / 1.35,
    fontWeight: "700",
  },
  sheetCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterWrap: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    flexDirection: "row",
    gap: 6,
  },
  filterButton: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: "center",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rowCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFEFC",
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF5ED",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 19 / 1.3,
    fontWeight: "700",
  },
  rowSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  rowRight: {
    alignItems: "flex-end",
  },
  rowPoints: {
    fontSize: 24 / 1.4,
    fontWeight: "700",
  },
  rowDate: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptySub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
  },
});

export default ProfileScreen;
