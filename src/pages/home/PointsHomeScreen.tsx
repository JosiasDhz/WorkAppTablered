import React, { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { HeaderAvatar } from "../../components/HeaderAvatar";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SoftReveal } from "../../components/SoftPressable";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { SCREEN_GUTTER } from "../../theme/layout";
import type { RootState } from "../../redux/store/store";
import {
  buildUserDisplayNameFull,
  buildUserFirstName,
  resolveWorkerCode,
} from "../../utils/userDisplayName";
import { resolveWorkerRoleLabel } from "../../utils/workerRoleLabelEs";
import { usePointsDemo } from "./points/demo/usePointsDemo";
import { PointsMovementsSection } from "./points/PointsMovementsSection";
import { SlideDownReveal } from "./points/SlideDownReveal";
import { WalletFlipCard } from "./points/wallet/WalletFlipCard";
import { usePointsColors } from "./points/pointsTheme";
import { formatPoints, type PointsLedgerRow } from "./points/pointsTypes";

export default function PointsHomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();
  const pointsColors = usePointsColors();
  const { user, seller } = useSelector((state: RootState) => state.auth);
  const {
    balance,
    rows,
    hasMore,
    loadingMore,
    refreshing,
    loadMore,
    refresh,
  } = usePointsDemo();

  const memberName = useMemo(
    () => buildUserDisplayNameFull(user, seller),
    [user, seller],
  );
  const firstName = useMemo(
    () => buildUserFirstName(user, seller),
    [user, seller],
  );
  const memberCode = useMemo(
    () => resolveWorkerCode(user, seller),
    [user, seller],
  );
  const roleLabel = useMemo(
    () => resolveWorkerRoleLabel(user, seller),
    [user, seller],
  );

  const walletHeadline = formatPoints(balance.total);
  const walletCaption = `Vence ${balance.expiresLabel}`;

  const openMovement = useCallback(
    (row: PointsLedgerRow) => {
      navigation.navigate("SaleDetail", {
        folio: row.reference,
        points: row.points,
        sucursal: row.branch,
        date: row.dateLabel,
      });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <HeaderTitle
        title={`Hola, ${firstName}`}
        subtitle={roleLabel}
        tone="light"
        style={styles.header}
        titleColor={pointsColors.heading}
        leadingAccessory={<HeaderAvatar size={52} />}
      />

      <View
        style={[
          styles.body,
          { paddingBottom: Math.max(tabBarHeight, insets.bottom) + 12 },
        ]}
      >
        <SoftReveal style={styles.walletBlock}>
          <WalletFlipCard
            memberName={memberName}
            memberCode={memberCode}
            headline={walletHeadline}
            caption={walletCaption}
          />
        </SoftReveal>

        <SlideDownReveal style={styles.listBlock}>
          <PointsMovementsSection
            rows={rows}
            hasMore={hasMore}
            loadingMore={loadingMore}
            refreshing={refreshing}
            onEndReached={loadMore}
            onRefresh={refresh}
            onScroll={onAutoTabBarScroll}
            onSelect={openMovement}
          />
        </SlideDownReveal>
      </View>
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
  body: {
    flex: 1,
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 4,
  },
  walletBlock: {
    width: "100%",
    marginTop: 4,
  },
  listBlock: {
    flex: 1,
    width: "100%",
    marginTop: 16,
  },
});
