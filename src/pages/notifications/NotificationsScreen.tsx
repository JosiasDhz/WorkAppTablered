import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { TickCircle } from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { PageFlipReveal } from "../../components/PageFlipReveal";
import { SoftPressable } from "../../components/SoftPressable";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { SCREEN_GUTTER } from "../../theme/layout";
import { useInAppNotifications } from "./useInAppNotifications";
import {
  clampFlipDelay,
  NotificationGroupSection,
  NOTIFICATION_FLIP_STAGGER_MS,
} from "./NotificationGroupSection";
import { NotificationsEmptyState } from "./NotificationsEmptyState";
import { NOTIFICATION_COLORS } from "./notificationsTheme";

function describeUnread(unreadCount: number): string {
  if (unreadCount === 0) return "Estás al día con tus avisos";
  if (unreadCount === 1) return "Tienes 1 aviso sin leer";
  return `Tienes ${unreadCount} avisos sin leer`;
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();
  const { groups, unreadCount, refreshing, markRead, markAllRead, refresh } =
    useInAppNotifications();
  const [listRevealActive, setListRevealActive] = useState(false);

  useEffect(() => {
    if (isFocused) setListRevealActive(true);
  }, [isFocused]);

  const visibleGroups = useMemo(
    () => groups.filter((group) => group.items.length > 0),
    [groups],
  );

  const revealDelays = useMemo(() => {
    let cursor = 0;
    return visibleGroups.map((group) => {
      const delay = cursor;
      cursor += (group.items.length + 1) * NOTIFICATION_FLIP_STAGGER_MS;
      return delay;
    });
  }, [visibleGroups]);

  const footerDelay = useMemo(() => {
    const lastGroup = visibleGroups[visibleGroups.length - 1];
    const lastDelay = revealDelays[revealDelays.length - 1] ?? 0;
    const lastItems = lastGroup ? lastGroup.items.length + 1 : 0;
    return clampFlipDelay(lastDelay + lastItems * NOTIFICATION_FLIP_STAGGER_MS);
  }, [revealDelays, visibleGroups]);

  const onBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const onSelect = useCallback(
    (id: string) => {
      const item = groups
        .flatMap((group) => group.items)
        .find((row) => row.id === id);
      markRead(id);
      navigation.navigate("NotificationDetail", {
        notificationId: id,
        title: item?.title,
        body: item?.body,
        type: item?.type,
      });
    },
    [groups, markRead, navigation],
  );

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <HeaderTitle
        title="Avisos"
        subtitle={describeUnread(unreadCount)}
        tone="light"
        style={styles.header}
        onBack={onBack}
        rightAccessory={
          unreadCount > 0 ? (
            <SoftPressable
              onPress={markAllRead}
              scaleTo={0.94}
              style={styles.markAllBtn}
              accessibilityLabel="Marcar todos los avisos como leídos"
            >
              <TickCircle
                size={20}
                color={NOTIFICATION_COLORS.accent}
                variant="Linear"
              />
            </SoftPressable>
          ) : null
        }
      />

      <ScrollView
        onScroll={onAutoTabBarScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(tabBarHeight, insets.bottom) + 36 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={NOTIFICATION_COLORS.ink}
          />
        }
      >
        {visibleGroups.length === 0 ? (
          <NotificationsEmptyState />
        ) : (
          <React.Fragment>
            {visibleGroups.map((group, index) => (
              <View
                key={group.id}
                style={index === 0 ? styles.firstBlock : styles.sectionBlock}
              >
                <NotificationGroupSection
                  group={group}
                  onSelect={onSelect}
                  revealDelay={revealDelays[index]}
                  revealActive={listRevealActive}
                />
              </View>
            ))}
            <PageFlipReveal delay={footerDelay} active={listRevealActive}>
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Desliza hacia abajo para actualizar tus avisos.
                </Text>
              </View>
            </PageFlipReveal>
          </React.Fragment>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SCREEN_GUTTER,
  },
  markAllBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NOTIFICATION_COLORS.accentSoft,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "stretch",
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 4,
  },
  firstBlock: {
    width: "100%",
    marginTop: 8,
  },
  sectionBlock: {
    width: "100%",
    marginTop: 22,
  },
  footer: {
    marginTop: 18,
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "500",
    color: NOTIFICATION_COLORS.muted,
    textAlign: "center",
  },
});
