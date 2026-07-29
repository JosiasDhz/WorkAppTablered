import React, { useCallback, useMemo, useState, type ComponentType } from "react";
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
  ArrowRight2,
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
  divider: "#F1F3F5",
  accent: TAB_BAR_PRIMARY,
  accentSoft: "#FFF1E0",
  accentDeep: "#C45F00",
  iconTint: "#FFF4E8",
};

type IconProps = {
  size?: number;
  color?: string;
  variant?: "Linear" | "Outline" | "Bold" | "Bulk" | "Broken" | "TwoTone";
};

type MenuAction = "none" | "MisRegistros" | "MisPermisos" | "MisIncapacidades" | "MisExpediente" | "Inventory" | "InventoryAudit" | "InventoryAuditLossDocuments";

type MenuItem = {
  id: string;
  label: string;
  icon: ComponentType<IconProps>;
  action: MenuAction;
};

type MenuSectionData = {
  id: string;
  title: string;
  items: MenuItem[];
};

const MENU_SECTIONS: MenuSectionData[] = [
  {
    id: "cuenta",
    title: "Cuenta",
    items: [
      { id: "edit", label: "Editar perfil", icon: Edit2, action: "none" },
      { id: "registros", label: "Mis registros", icon: Calendar1, action: "MisRegistros" },
      { id: "permisos", label: "Mis permisos", icon: DocumentText1, action: "MisPermisos" },
      { id: "incapacidades", label: "Mis incapacidades", icon: Health, action: "MisIncapacidades" },
      { id: "expediente", label: "Mi expediente", icon: FolderOpen, action: "MisExpediente" },
    ],
  },
  {
    id: "preferencias",
    title: "Preferencias",
    items: [
      { id: "apariencia", label: "Apariencia", icon: Setting4, action: "none" },
      { id: "dispositivos", label: "Gestionar dispositivos", icon: Profile2User, action: "none" },
      { id: "password", label: "Cambiar contraseña", icon: Coin, action: "none" },
    ],
  },
  {
    id: "admin",
    title: "Administración",
    items: [
      { id: "productos", label: "Productos (Admin)", icon: Barcode, action: "Inventory" },
      { id: "auditoria", label: "Auditoría inventario", icon: CodeCircle, action: "InventoryAudit" },
      { id: "actas", label: "Actas auditoría", icon: DocumentText1, action: "InventoryAuditLossDocuments" },
    ],
  },
];

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

function MenuRow({
  item,
  isLast,
  onPress,
}: {
  item: MenuItem;
  isLast: boolean;
  onPress: () => void;
}) {
  const Icon = item.icon;
  return (
    <TouchableOpacity
      activeOpacity={0.72}
      onPress={onPress}
      style={[styles.menuRow, !isLast && styles.menuRowBorder]}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <View style={styles.menuInner}>
        <View style={styles.menuIconWrap}>
          <Icon size={17} color={COLORS.accentDeep} variant="Linear" />
        </View>
        <Text style={styles.menuLabel}>{item.label}</Text>
      </View>
      <ArrowRight2 size={16} color="#B0B7C3" variant="Linear" />
    </TouchableOpacity>
  );
}

function MenuSection({
  section,
  onItemPress,
}: {
  section: MenuSectionData;
  onItemPress: (item: MenuItem) => void;
}) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionCard}>
        {section.items.map((item, index) => (
          <MenuRow
            key={item.id}
            item={item}
            isLast={index === section.items.length - 1}
            onPress={() => onItemPress(item)}
          />
        ))}
      </View>
    </View>
  );
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

  const onMenuItemPress = useCallback(
    (item: MenuItem) => {
      if (item.action === "none") return;
      navigation.navigate(item.action as never);
    },
    [navigation],
  );

  const heroHeight = HERO_BASE + insets.top;

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
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
              </View>
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
                {MENU_SECTIONS.map((section) => (
                  <MenuSection
                    key={section.id}
                    section={section}
                    onItemPress={onMenuItemPress}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={handleLogout}
                activeOpacity={0.75}
                style={styles.logoutBtn}
                accessibilityRole="button"
                accessibilityLabel="Cerrar sesión"
              >
                <Logout size={18} color={COLORS.accent} variant="Linear" />
                <Text style={styles.logoutText}>Cerrar sesión</Text>
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
    backgroundColor: COLORS.bg,
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
    paddingTop: SHEET_OVERLAP + 18,
    paddingBottom: 4,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  menuScroll: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
    paddingHorizontal: 20,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: COLORS.text,
    alignSelf: "stretch",
  },
  roleBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: COLORS.accentSoft,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accentDeep,
  },
  emailPressable: {
    marginTop: 8,
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
    fontWeight: "500",
    color: COLORS.muted,
  },
  menuBlock: {
    marginTop: 16,
    gap: 18,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionTitle: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: COLORS.muted,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  menuRow: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  menuInner: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.iconTint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  menuLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  logoutBtn: {
    marginTop: 22,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.accent,
  },
});
