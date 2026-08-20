import React, { useCallback, useMemo, useState, type ComponentType } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import {
  ArrowRight2,
  Barcode,
  Calendar1,
  ClipboardTick,
  CodeCircle,
  Coin,
  DocumentText1,
  FolderOpen,
  Health,
  Edit2,
  Logout,
  Notification,
  PasswordCheck,
  Profile2User,
  Setting4,
} from "iconsax-react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store/store";
import { clearStorage } from "../../utils";
import { logout } from "../../redux/slices/authSlice";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { HeaderAvatar } from "../../components/HeaderAvatar";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SoftPressable, SoftReveal } from "../../components/SoftPressable";
import { TapImagePreview } from "../../components/TapImagePreview";
import type { AppDispatch } from "../../redux/store/store";
import { refreshAuthSession } from "../../services/refreshAuthSession";
import { SCREEN_GUTTER } from "../../theme/layout";
import { resolveWorkerRoleLabel } from "../../utils/workerRoleLabelEs";
import {
  buildUserDisplayNameFull,
  resolveWorkerCode,
} from "../../utils/userDisplayName";

const AVATAR_SIZE = 96;

const COLORS = {
  surface: "#FFFFFF",
  ink: "#1C1C1E",
  muted: "#8E8E93",
  divider: "rgba(60, 60, 67, 0.12)",
  accent: "#EA7600",
};

type IconProps = {
  size?: number;
  color?: string;
  variant?: "Linear" | "Outline" | "Bold" | "Bulk" | "Broken" | "TwoTone";
};

type MenuAction =
  | "none"
  | "MisRegistros"
  | "MisPermisos"
  | "MisIncapacidades"
  | "MisExpediente"
  | "MisComisiones"
  | "Inventory"
  | "InventoryAudit"
  | "InventoryAuditLossDocuments";

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

type Shortcut = {
  id: string;
  label: string;
  icon: ComponentType<IconProps>;
  action: MenuAction;
};

const SHORTCUTS: Shortcut[] = [
  { id: "permisos", label: "Permisos", icon: ClipboardTick, action: "MisPermisos" },
  { id: "expediente", label: "Expediente", icon: FolderOpen, action: "MisExpediente" },
  { id: "comisiones", label: "Comisiones", icon: Coin, action: "MisComisiones" },
  { id: "registros", label: "Registros", icon: Calendar1, action: "MisRegistros" },
];

const MENU_SECTIONS: MenuSectionData[] = [
  {
    id: "cuenta",
    title: "Perfil y cuenta",
    items: [
      { id: "edit", label: "Editar perfil", icon: Edit2, action: "none" },
      { id: "incapacidades", label: "Mis incapacidades", icon: Health, action: "MisIncapacidades" },
    ],
  },
  {
    id: "preferencias",
    title: "Preferencias",
    items: [
      { id: "apariencia", label: "Apariencia", icon: Setting4, action: "none" },
      { id: "dispositivos", label: "Gestionar dispositivos", icon: Profile2User, action: "none" },
      { id: "password", label: "Cambiar contraseña", icon: PasswordCheck, action: "none" },
      { id: "notify", label: "Notificaciones", icon: Notification, action: "none" },
    ],
  },
  {
    id: "admin",
    title: "Administración",
    items: [
      { id: "productos", label: "Productos", icon: Barcode, action: "Inventory" },
      { id: "auditoria", label: "Auditoría de inventario", icon: CodeCircle, action: "InventoryAudit" },
      { id: "actas", label: "Actas de auditoría", icon: DocumentText1, action: "InventoryAuditLossDocuments" },
    ],
  },
];

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
    <SoftPressable onPress={onPress} scaleTo={0.99} accessibilityLabel={item.label}>
      <View style={styles.menuRow}>
        <Icon size={22} color={COLORS.ink} variant="Linear" />
        <View style={[styles.menuMain, !isLast && styles.menuRowBorder]}>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <ArrowRight2 size={16} color={COLORS.muted} variant="Linear" />
        </View>
      </View>
    </SoftPressable>
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
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await clearStorage();
    dispatch(logout());
  };

  const name = useMemo(
    () => buildUserDisplayNameFull(user, seller),
    [user, seller],
  );
  const email = user?.email || seller?.email || "";
  const hasUserPhoto = Boolean(userAvatar && String(userAvatar).trim());
  const roleLabel = useMemo(
    () => resolveWorkerRoleLabel(user, seller),
    [user, seller],
  );
  const workerCode = resolveWorkerCode(user, seller);
  const warehouseName =
    seller?.warehouse?.name || seller?.branch?.name || user?.warehouse?.name || "—";
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

  const go = useCallback(
    (action: MenuAction) => {
      if (action === "none") return;
      navigation.navigate(action as never);
    },
    [navigation],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <HeaderTitle
        title="Cuenta"
        subtitle="Tus datos personales y preferencias"
        tone="light"
        style={styles.header}
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
      />

      <ScrollView
        onScroll={onAutoTabBarScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "stretch",
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 8,
          paddingBottom: Math.max(tabBarHeight, insets.bottom) + 36,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.ink}
          />
        }
      >
        <SoftReveal>
          <View style={styles.hero}>
            <View style={styles.avatarWrap}>
              <TapImagePreview uri={avatarUri} enabled={hasUserPhoto}>
                <HeaderAvatar size={AVATAR_SIZE} />
              </TapImagePreview>
            </View>
            <SoftPressable
              onPress={email ? copyEmail : undefined}
              feedback={Boolean(email)}
              scaleTo={0.99}
              accessibilityLabel="Nombre de usuario"
            >
              <Text style={styles.name} numberOfLines={2}>
                {name}
              </Text>
            </SoftPressable>
            {email ? (
              <Text style={styles.email} numberOfLines={1}>
                {email}
              </Text>
            ) : null}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue} numberOfLines={1}>
                  {workerCode}
                </Text>
                <Text style={styles.statLabel}>Código</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue} numberOfLines={1}>
                  {roleLabel}
                </Text>
                <Text style={styles.statLabel}>Puesto</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue} numberOfLines={1}>
                  {warehouseName}
                </Text>
                <Text style={styles.statLabel}>Almacén</Text>
              </View>
            </View>
          </View>
        </SoftReveal>

        <SoftReveal delay={70} style={styles.shortcutGrid}>
          {SHORTCUTS.map((item) => {
            const Icon = item.icon;
            return (
              <View key={item.id} style={styles.shortcutCell}>
                <SoftPressable
                  onPress={() => go(item.action)}
                  scaleTo={0.97}
                  style={styles.shortcutCard}
                  accessibilityLabel={item.label}
                >
                  <View style={styles.shortcutIcon}>
                    <Icon size={20} color={COLORS.accent} variant="Linear" />
                  </View>
                  <Text style={styles.shortcutLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                </SoftPressable>
              </View>
            );
          })}
        </SoftReveal>

        {MENU_SECTIONS.map((section, sectionIndex) => (
          <SoftReveal
            key={section.id}
            delay={160 + sectionIndex * 70}
            style={styles.sectionBlock}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <MenuRow
                  key={item.id}
                  item={item}
                  isLast={index === section.items.length - 1}
                  onPress={() => go(item.action)}
                />
              ))}
            </View>
          </SoftReveal>
        ))}

        <SoftReveal delay={320}>
          <SoftPressable
            onPress={() => void handleLogout()}
            scaleTo={0.99}
            accessibilityLabel="Cerrar sesión"
            style={styles.logoutCard}
          >
            <Logout size={22} color={COLORS.accent} variant="Linear" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </SoftPressable>
        </SoftReveal>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SCREEN_GUTTER,
  },
  hero: {
    width: "100%",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  avatarWrap: {
    alignSelf: "center",
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: COLORS.ink,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  email: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
    textAlign: "center",
  },
  statsRow: {
    marginTop: 22,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.ink,
    textAlign: "center",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.muted,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: COLORS.divider,
  },
  shortcutGrid: {
    width: "100%",
    marginTop: 22,
    flexDirection: "row",
    gap: 8,
  },
  shortcutCell: {
    flex: 1,
    minWidth: 0,
  },
  shortcutCard: {
    width: "100%",
    minHeight: 92,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(234, 118, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.ink,
    textAlign: "center",
  },
  sectionBlock: {
    width: "100%",
    marginTop: 22,
  },
  sectionTitle: {
    marginLeft: 16,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  menuRow: {
    minHeight: 52,
    paddingLeft: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  menuMain: {
    flex: 1,
    minHeight: 52,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: COLORS.ink,
  },
  logoutCard: {
    marginTop: 22,
    width: "100%",
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "400",
    color: COLORS.accent,
  },
});
