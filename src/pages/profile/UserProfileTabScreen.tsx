import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  Barcode,
  Calendar1,
  CodeCircle,
  Coin,
  DocumentText1,
  FolderOpen,
  Health,
  Edit2,
  Logout,
  Notification,
  Profile2User,
  Setting4,
} from "iconsax-react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store/store";
import { clearStorage } from "../../utils";
import { logout } from "../../redux/slices/authSlice";
import { TAB_BAR_PRIMARY } from "../../routes/tabBar/tabBarConstants";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { TapImagePreview } from "../../components/TapImagePreview";
import type { AppDispatch } from "../../redux/store/store";
import { refreshAuthSession } from "../../services/refreshAuthSession";
import { mapWorkerRoleLabelEs } from "../../utils/workerRoleLabelEs";

const FALLBACK_AVATAR = require("../../../assets/icon.png");
const LOGO_ASSET = require("../../../assets/table-red-logo.png");

const HERO_BASE = 200;
const AVATAR_SIZE = 112;
const AVATAR_BORDER = 2;
const SHEET_OVERLAP = AVATAR_SIZE / 2;
const SHEET_TOP_RADIUS = 28;
const ORANGE_HERO = ["#FF9A4D", TAB_BAR_PRIMARY, "#C45F00"] as const;

const COLORS = {
  bg: "#F7F7F6",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  border: "#EEF1F4",
  accent: "#EA7600",
};

function buildUserDisplayNameFull(user: any, seller: any): string {
  const fromUser = [user?.name, user?.lastName, user?.secondLastName]
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fromUser) return fromUser;
  const sn =
    (typeof seller?.name === "string" && seller.name.trim()) ||
    (typeof seller?.user?.name === "string" && seller.user.name.trim());
  if (sn) {
    const extra = [seller?.user?.lastName, seller?.user?.secondLastName]
      .map((p) => (typeof p === "string" ? p.trim() : ""))
      .filter(Boolean);
    return [sn, ...extra].join(" ").trim();
  }
  return "Usuario";
}

function resolveRoleLabel(user: any, seller: any): string {
  const fromSeller =
    typeof seller?.position?.name === "string" ? seller.position.name.trim() : "";
  if (fromSeller) return mapWorkerRoleLabelEs(fromSeller);
  const rol = typeof user?.rol === "string" ? user.rol.trim() : "";
  if (rol) return mapWorkerRoleLabelEs(rol);
  const up = user?.position;
  if (typeof up === "string" && up.trim()) return mapWorkerRoleLabelEs(up.trim());
  if (up && typeof up.name === "string" && up.name.trim()) {
    return mapWorkerRoleLabelEs(up.name.trim());
  }
  return "Usuario";
}

export default function UserProfileTabScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();
  const { user, seller, userAvatar } = useSelector(
    (state: RootState) => state.auth,
  );

  const handleLogout = async () => {
    await clearStorage();
    dispatch(logout());
  };

  const name = useMemo(
    () => buildUserDisplayNameFull(user, seller),
    [user, seller],
  );
  const email = user?.email || seller?.email || "";
  const hasUserPhoto = Boolean(userAvatar && String(userAvatar).trim());
  const roleLabel = useMemo(() => resolveRoleLabel(user, seller), [user, seller]);

  const [refreshing, setRefreshing] = useState(false);

  const avatarUri =
    userAvatar && String(userAvatar).trim() ? String(userAvatar).trim() : "";

  useFocusEffect(
    useCallback(() => {
      refreshAuthSession(dispatch).catch(() => {});
    }, [dispatch]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAuthSession(dispatch);
    } catch {
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const copyEmail = useCallback(async () => {
    if (!email) return;
    await Clipboard.setStringAsync(email);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [email]);

  const heroHeight = HERO_BASE + insets.top;

  const profileMenu = [
    { id: "m3", label: "Apariencia", icon: Setting4 },
    { id: "m5", label: "Gestionar dispositivos", icon: Profile2User },
    { id: "m6", label: "Cambiar contrasena", icon: Coin },
    { id: "m7", label: "Productos (Admin)", icon: Barcode },
    { id: "m8", label: "Auditoria inventario", icon: CodeCircle },
    { id: "m9", label: "Actas auditoría", icon: DocumentText1 },
  ];

  const blurTint = hasUserPhoto ? ("dark" as const) : ("light" as const);
  const blurIntensity = Platform.OS === "ios" ? (hasUserPhoto ? 55 : 72) : hasUserPhoto ? 64 : 88;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: COLORS.bg }]}
      edges={["left", "right", "bottom"]}
    >
      <View style={{ height: heroHeight, overflow: "hidden" }}>
        {hasUserPhoto ? (
          <Image
            source={{ uri: avatarUri }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={[...ORANGE_HERO]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <BlurView
          intensity={blurIntensity}
          tint={blurTint}
          {...(Platform.OS === "android"
            ? {
                experimentalBlurMethod: "dimezisBlurView" as const,
                blurReductionFactor: 1,
              }
            : {})}
          style={StyleSheet.absoluteFillObject}
        />
        <HeaderTitle
          title="Perfil"
          subtitle="Tu cuenta Table Red"
          tone={hasUserPhoto ? "dark" : "light"}
          onBack={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 25,
            paddingTop: insets.top + 8,
            paddingBottom: 6,
          }}
          rightAccessory={
            <TouchableOpacity
              style={[
                styles.notifyFab,
                hasUserPhoto ? styles.notifyFabDark : styles.notifyFabLight,
              ]}
              onPress={() => {}}
              activeOpacity={0.85}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Notificaciones"
            >
              <Notification
                size={22}
                color={hasUserPhoto ? "#FFFFFF" : COLORS.text}
                variant="Outline"
              />
            </TouchableOpacity>
          }
        />
      </View>

      <View style={styles.bodyUnderHero}>
        <View style={styles.sheetStack}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetIdentity}>
              <Text style={styles.nameCenter} numberOfLines={2}>
                {name}
              </Text>
              <Text style={styles.roleCenter}>{roleLabel}</Text>
              {email ? (
                <Pressable
                  onLongPress={copyEmail}
                  delayLongPress={380}
                  style={({ pressed }) => [
                    styles.emailPressable,
                    pressed && styles.emailPressablePressed,
                  ]}
                >
                  <Text style={styles.emailCenter} numberOfLines={1}>
                    {email}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <ScrollView
              onScroll={onAutoTabBarScroll}
              scrollEventThrottle={16}
              style={styles.menuScroll}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: Math.max(tabBarHeight, 136) + 24,
                flexGrow: 1,
              }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.accent}
                  colors={[COLORS.accent]}
                />
              }
            >
              <View style={styles.menuBlock}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.menuRow}
                  onPress={() => {}}
                >
                  <View style={styles.menuInner}>
                    <View style={styles.menuIconWrap}>
                      <Edit2 size={16} color={COLORS.text} variant="Linear" />
                    </View>
                    <Text style={styles.menuLabel}>Editar perfil</Text>
                  </View>
                  <Text style={styles.menuChevron}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.menuRow}
                  onPress={() => navigation.navigate("MisRegistros" as never)}
                >
                  <View style={styles.menuInner}>
                    <View style={styles.menuIconWrap}>
                      <Calendar1 size={16} color={COLORS.text} variant="Linear" />
                    </View>
                    <Text style={styles.menuLabel}>Mis registros</Text>
                  </View>
                  <Text style={styles.menuChevron}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.menuRow}
                  onPress={() => navigation.navigate("MisPermisos" as never)}
                >
                  <View style={styles.menuInner}>
                    <View style={styles.menuIconWrap}>
                      <DocumentText1 size={16} color={COLORS.text} variant="Linear" />
                    </View>
                    <Text style={styles.menuLabel}>Mis permisos</Text>
                  </View>
                  <Text style={styles.menuChevron}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.menuRow}
                  onPress={() => navigation.navigate("MisIncapacidades" as never)}
                >
                  <View style={styles.menuInner}>
                    <View style={styles.menuIconWrap}>
                      <Health size={16} color={COLORS.text} variant="Linear" />
                    </View>
                    <Text style={styles.menuLabel}>Mis incapacidades</Text>
                  </View>
                  <Text style={styles.menuChevron}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.menuRow}
                  onPress={() => navigation.navigate("MisExpediente" as never)}
                >
                  <View style={styles.menuInner}>
                    <View style={styles.menuIconWrap}>
                      <FolderOpen size={16} color={COLORS.text} variant="Linear" />
                    </View>
                    <Text style={styles.menuLabel}>Mi expediente</Text>
                  </View>
                  <Text style={styles.menuChevron}>›</Text>
                </TouchableOpacity>
                {profileMenu.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.9}
                      style={styles.menuRow}
                      onPress={() => {
                        if (item.id === "m7") {
                          navigation.navigate("Inventory" as never);
                        }
                        if (item.id === "m8") {
                          navigation.navigate("InventoryAudit" as never);
                        }
                        if (item.id === "m9") {
                          navigation.navigate("InventoryAuditLossDocuments" as never);
                        }
                      }}
                    >
                      <View style={styles.menuInner}>
                        <View style={styles.menuIconWrap}>
                          <Icon size={16} color={COLORS.text} variant="Linear" />
                        </View>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                      </View>
                      <Text style={styles.menuChevron}>›</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={handleLogout}
                activeOpacity={0.9}
                style={styles.logoutBtn}
              >
                <Logout size={22} color={TAB_BAR_PRIMARY} variant="Linear" />
                <Text style={styles.logoutText}>Cerrar sesion</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.avatarFloat} pointerEvents="box-none">
            <View style={styles.avatarInner}>
              <TapImagePreview uri={avatarUri} enabled={hasUserPhoto}>
                <View
                  style={[
                    styles.avatarRing,
                    {
                      width: AVATAR_SIZE,
                      height: AVATAR_SIZE,
                      borderRadius: AVATAR_SIZE / 2,
                      borderWidth: AVATAR_BORDER,
                    },
                  ]}
                >
                  <Image
                    source={
                      hasUserPhoto ? { uri: avatarUri } : LOGO_ASSET
                    }
                    style={{
                      width: AVATAR_SIZE - AVATAR_BORDER * 2,
                      height: AVATAR_SIZE - AVATAR_BORDER * 2,
                      borderRadius: (AVATAR_SIZE - AVATAR_BORDER * 2) / 2,
                    }}
                    resizeMode={hasUserPhoto ? "cover" : "contain"}
                    defaultSource={FALLBACK_AVATAR}
                  />
                </View>
              </TapImagePreview>
              <View style={styles.avatarEditBadge}>
                <Edit2 size={13} color="#FFFFFF" variant="Bold" />
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  notifyFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notifyFabLight: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  notifyFabDark: {
    backgroundColor: "rgba(15, 23, 42, 0.38)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  bodyUnderHero: {
    flex: 1,
    marginTop: -SHEET_OVERLAP,
    zIndex: 1,
  },
  sheetStack: {
    flex: 1,
    position: "relative",
    overflow: "visible",
  },
  sheetCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SHEET_TOP_RADIUS,
    borderTopRightRadius: SHEET_TOP_RADIUS,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  sheetIdentity: {
    paddingHorizontal: 20,
    paddingTop: SHEET_OVERLAP + 20,
    paddingBottom: 8,
  },
  menuScroll: {
    flex: 1,
  },
  avatarFloat: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -SHEET_OVERLAP,
    alignItems: "center",
    zIndex: 30,
    elevation: 14,
  },
  avatarInner: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: "relative",
  },
  avatarRing: {
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderColor: "#FFFFFF",
  },
  avatarEditBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  nameCenter: {
    marginTop: 0,
    paddingHorizontal: 24,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
    alignSelf: "stretch",
  },
  roleCenter: {
    marginTop: 4,
    paddingHorizontal: 24,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
    alignSelf: "stretch",
  },
  emailPressable: {
    marginTop: 6,
    alignSelf: "stretch",
    paddingVertical: 4,
    borderRadius: 8,
  },
  emailPressablePressed: {
    opacity: 0.7,
  },
  emailCenter: {
    paddingHorizontal: 24,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
  },
  menuBlock: {
    marginTop: 20,
    gap: 10,
  },
  menuRow: {
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  menuLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  menuChevron: {
    color: "#9CA3AF",
    fontSize: 18,
    fontWeight: "700",
  },
  logoutBtn: {
    marginTop: 20,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#F2D0B2",
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "700",
    color: TAB_BAR_PRIMARY,
  },
});
