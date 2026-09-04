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
  CalendarTick,
  CodeCircle,
  Coin,
  DocumentText1,
  FolderOpen,
  Edit2,
  Logout,
  Notification,
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
import { useAppAppearance } from "../../theme/appearance";
import { resolveWorkerRoleLabel } from "../../utils/workerRoleLabelEs";
import {
  buildUserDisplayNameFull,
  resolveWorkerCode,
} from "../../utils/userDisplayName";

const AVATAR_SIZE = 96;

type IconProps = {
  size?: number;
  color?: string;
  variant?: "Linear" | "Outline" | "Bold" | "Bulk" | "Broken" | "TwoTone";
};

type MenuAction =
  | "none"
  | "MisRegistros"
  | "MisPermisos"
  | "MisVacaciones"
  | "MisExpediente"
  | "MisComisiones"
  | "Apariencia"
  | "NotificationsStack"
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
  { id: "vacaciones", label: "Vacaciones", icon: CalendarTick, action: "MisVacaciones" },
  { id: "expediente", label: "Expediente", icon: FolderOpen, action: "MisExpediente" },
  { id: "comisiones", label: "Comisiones", icon: Coin, action: "MisComisiones" },
];

const MENU_SECTIONS: MenuSectionData[] = [
  {
    id: "cuenta",
    title: "Perfil y cuenta",
    items: [
      { id: "edit", label: "Editar perfil", icon: Edit2, action: "none" },
    ],
  },
  {
    id: "preferencias",
    title: "Preferencias",
    items: [
      { id: "apariencia", label: "Apariencia", icon: Setting4, action: "Apariencia" },
      { id: "registros", label: "Mis registros", icon: Calendar1, action: "MisRegistros" },
      { id: "notify", label: "Notificaciones", icon: Notification, action: "NotificationsStack" },
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
  ink,
  muted,
  divider,
  onPress,
}: {
  item: MenuItem;
  isLast: boolean;
  ink: string;
  muted: string;
  divider: string;
  onPress: () => void;
}) {
  const Icon = item.icon;
  return (
    <SoftPressable onPress={onPress} scaleTo={0.99} accessibilityLabel={item.label}>
      <View style={styles.menuRow}>
        <Icon size={22} color={ink} variant="Linear" />
        <View
          style={[
            styles.menuMain,
            !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: divider },
          ]}
        >
          <Text style={[styles.menuLabel, { color: ink }]}>{item.label}</Text>
          <ArrowRight2 size={16} color={muted} variant="Linear" />
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
  const { colors } = useAppAppearance();
  const ink = colors.ink;
  const muted = colors.mutedInk;
  const surface = colors.surface;
  const accent = colors.accent;
  const divider = colors.border;

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
      if (action === "NotificationsStack") {
        const tabs = navigation.getParent();
        if (tabs) {
          tabs.navigate("NotificationsStack");
          return;
        }
        navigation.navigate("NotificationsStack" as never);
        return;
      }
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
            tintColor={ink}
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
              <Text style={[styles.name, { color: ink }]} numberOfLines={2}>
                {name}
              </Text>
            </SoftPressable>
            {email ? (
              <Text style={[styles.email, { color: muted }]} numberOfLines={1}>
                {email}
              </Text>
            ) : null}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: ink }]} numberOfLines={1}>
                  {workerCode}
                </Text>
                <Text style={[styles.statLabel, { color: muted }]}>Código</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: divider }]} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: ink }]} numberOfLines={1}>
                  {roleLabel}
                </Text>
                <Text style={[styles.statLabel, { color: muted }]}>Puesto</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: divider }]} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: ink }]} numberOfLines={1}>
                  {warehouseName}
                </Text>
                <Text style={[styles.statLabel, { color: muted }]}>Almacén</Text>
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
                  style={[styles.shortcutCard, { backgroundColor: surface }]}
                  accessibilityLabel={item.label}
                >
                  <View
                    style={[
                      styles.shortcutIcon,
                      { backgroundColor: colors.accentSoft },
                    ]}
                  >
                    <Icon size={20} color={accent} variant="Linear" />
                  </View>
                  <Text
                    style={[styles.shortcutLabel, { color: ink }]}
                    numberOfLines={1}
                  >
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
            <Text style={[styles.sectionTitle, { color: muted }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: surface }]}>
              {section.items.map((item, index) => (
                <MenuRow
                  key={item.id}
                  item={item}
                  isLast={index === section.items.length - 1}
                  ink={ink}
                  muted={muted}
                  divider={divider}
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
            style={[styles.logoutCard, { backgroundColor: surface }]}
          >
            <Logout size={22} color={accent} variant="Linear" />
            <Text style={[styles.logoutText, { color: accent }]}>
              Cerrar sesión
            </Text>
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
    textAlign: "center",
    paddingHorizontal: 16,
  },
  email: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
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
    textAlign: "center",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
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
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: "600",
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
  },
  sectionCard: {
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
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
  },
  logoutCard: {
    marginTop: 22,
    width: "100%",
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "400",
  },
});
