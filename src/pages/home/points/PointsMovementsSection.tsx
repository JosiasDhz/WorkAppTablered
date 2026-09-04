import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SoftPressable } from "../../../components/SoftPressable";
import { createThemedStyles } from "../../../theme/themedStyles";
import {
  POINTS_RADIUS,
  usePointsColors,
  type PointsColors,
} from "./pointsTheme";
import {
  describeKind,
  formatPoints,
  formatSignedPoints,
  type PointsLedgerRow,
} from "./pointsTypes";

const TABLE_GUTTER = 14;
const COLUMN_WIDTHS = {
  reference: 94 + TABLE_GUTTER,
  concept: 168,
  points: 78,
  balance: 74,
  kind: 78,
  date: 124 + TABLE_GUTTER,
} as const;
const TABLE_WIDTH = Object.values(COLUMN_WIDTHS).reduce(
  (sum, width) => sum + width,
  0,
);
const TABLE_HEIGHT = 372;

export type PointsMovementsSectionProps = {
  rows: PointsLedgerRow[];
  hasMore: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  onEndReached: () => void;
  onRefresh: () => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onSelect: (row: PointsLedgerRow) => void;
};

type PointsStyles = ReturnType<typeof buildPointsStyles>;

function kindChipStyle(kind: string, styles: PointsStyles) {
  if (kind === "redeem") return styles.kindChipRedeem;
  if (kind === "adjust") return styles.kindChipAdjust;
  return styles.kindChipEarn;
}

function kindTextStyle(kind: string, styles: PointsStyles) {
  if (kind === "redeem") return styles.kindTextRedeem;
  if (kind === "adjust") return styles.kindTextAdjust;
  return styles.kindTextEarn;
}

function LedgerRow({
  row,
  onPress,
}: {
  row: PointsLedgerRow;
  onPress: () => void;
}) {
  const styles = usePointsStyles();
  return (
    <SoftPressable
      onPress={onPress}
      scaleTo={0.995}
      accessibilityLabel={`Movimiento ${row.reference}`}
    >
      <View style={styles.row}>
        <Text style={[styles.reference, styles.refCell]} numberOfLines={1}>
          {row.reference}
        </Text>
        <Text style={[styles.concept, styles.conceptCell]} numberOfLines={1}>
          {row.concept}
        </Text>
        <Text
          style={[
            styles.numeric,
            styles.pointsCell,
            row.points < 0 ? styles.pointsNegative : styles.pointsPositive,
          ]}
        >
          {formatSignedPoints(row.points)}
        </Text>
        <Text style={[styles.numeric, styles.balanceCell]}>
          {formatPoints(row.balance)}
        </Text>
        <View style={styles.kindCell}>
          <View style={[styles.kindChip, kindChipStyle(row.kind, styles)]}>
            <Text style={[styles.kindText, kindTextStyle(row.kind, styles)]}>
              {describeKind(row.kind)}
            </Text>
          </View>
        </View>
        <Text style={[styles.date, styles.dateCell]} numberOfLines={1}>
          {row.dateLabel}
        </Text>
      </View>
    </SoftPressable>
  );
}

function TableHeader() {
  const styles = usePointsStyles();
  return (
    <View style={styles.headerRow}>
      <Text style={[styles.headerLabel, styles.refCell]}>Referencia</Text>
      <Text style={[styles.headerLabel, styles.conceptCell]}>Concepto</Text>
      <Text style={[styles.headerLabel, styles.pointsCell]}>Puntos</Text>
      <Text style={[styles.headerLabel, styles.balanceCell]}>Saldo</Text>
      <Text style={[styles.headerLabel, styles.kindCell]}>Tipo</Text>
      <Text style={[styles.headerLabel, styles.dateCell]}>Fecha</Text>
    </View>
  );
}

function Separator() {
  const styles = usePointsStyles();
  return <View style={styles.separator} />;
}

function EmptyState({ visibleWidth }: { visibleWidth: number }) {
  const styles = usePointsStyles();
  return (
    <View style={[styles.emptyRow, { width: visibleWidth }]}>
      <Text style={styles.emptyText}>Aún no tienes movimientos de puntos.</Text>
    </View>
  );
}

function ListFooter({
  loadingMore,
  hasMore,
  isEmpty,
  visibleWidth,
}: {
  loadingMore: boolean;
  hasMore: boolean;
  isEmpty: boolean;
  visibleWidth: number;
}) {
  const colors = usePointsColors();
  const styles = usePointsStyles();
  if (isEmpty) return null;
  if (loadingMore) {
    return (
      <View style={[styles.footer, { width: visibleWidth }]}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }
  if (hasMore) return <View style={styles.footerSpacer} />;
  return (
    <View style={[styles.footer, { width: visibleWidth }]}>
      <Text style={styles.footerText}>No hay más movimientos</Text>
    </View>
  );
}

export function PointsMovementsSection({
  rows,
  hasMore,
  loadingMore,
  refreshing,
  onEndReached,
  onRefresh,
  onScroll,
  onSelect,
}: PointsMovementsSectionProps) {
  const colors = usePointsColors();
  const styles = usePointsStyles();
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PointsLedgerRow>) => (
      <LedgerRow row={item} onPress={() => onSelect(item)} />
    ),
    [onSelect],
  );

  const keyExtractor = useCallback((item: PointsLedgerRow) => item.id, []);

  const [visibleWidth, setVisibleWidth] = useState(0);
  const onCardLayout = useCallback((event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);
    setVisibleWidth((current) => (current === width ? current : width));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card} onLayout={onCardLayout}>
        <ScrollView
          horizontal
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.table}>
            <TableHeader />
            <FlatList
              data={rows}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              onScroll={onScroll}
              scrollEventThrottle={16}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.5}
              ItemSeparatorComponent={Separator}
              ListEmptyComponent={<EmptyState visibleWidth={visibleWidth} />}
              ListFooterComponent={
                <ListFooter
                  loadingMore={loadingMore}
                  hasMore={hasMore}
                  isEmpty={rows.length === 0}
                  visibleWidth={visibleWidth}
                />
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.ink}
                />
              }
              showsVerticalScrollIndicator={false}
              initialNumToRender={8}
              windowSize={7}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function buildPointsStyles(colors: PointsColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      width: "100%",
    },
    card: {
      flex: 1,
      maxHeight: TABLE_HEIGHT,
      backgroundColor: colors.surface,
      borderRadius: POINTS_RADIUS.section,
      overflow: "hidden",
    },
    table: {
      width: TABLE_WIDTH,
      alignSelf: "stretch",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 12,
      paddingBottom: 10,
      backgroundColor: colors.tableHeader,
    },
    headerLabel: {
      fontSize: 10.5,
      fontWeight: "700",
      letterSpacing: 0.7,
      textTransform: "uppercase",
      color: colors.tableHeaderInk,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 52,
      paddingVertical: 10,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
    },
    refCell: {
      width: COLUMN_WIDTHS.reference,
      paddingLeft: TABLE_GUTTER,
      paddingRight: 10,
    },
    conceptCell: {
      width: COLUMN_WIDTHS.concept,
      paddingRight: 12,
    },
    pointsCell: {
      width: COLUMN_WIDTHS.points,
      paddingRight: 12,
      textAlign: "right",
    },
    balanceCell: {
      width: COLUMN_WIDTHS.balance,
      paddingRight: 14,
      textAlign: "right",
    },
    kindCell: {
      width: COLUMN_WIDTHS.kind,
      paddingRight: 10,
    },
    dateCell: {
      width: COLUMN_WIDTHS.date,
      paddingRight: TABLE_GUTTER,
    },
    reference: {
      fontSize: 12.5,
      fontWeight: "600",
      color: colors.muted,
      fontVariant: ["tabular-nums"],
    },
    concept: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.ink,
    },
    date: {
      fontSize: 12.5,
      fontWeight: "500",
      color: colors.muted,
    },
    kindChip: {
      alignSelf: "flex-start",
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    kindChipEarn: {
      backgroundColor: colors.positiveSoft,
    },
    kindChipRedeem: {
      backgroundColor: colors.negativeSoft,
    },
    kindChipAdjust: {
      backgroundColor: colors.accentSoft,
    },
    kindText: {
      fontSize: 10.5,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    kindTextEarn: {
      color: colors.positive,
    },
    kindTextRedeem: {
      color: colors.negative,
    },
    kindTextAdjust: {
      color: colors.accent,
    },
    numeric: {
      fontSize: 14.5,
      fontWeight: "700",
      color: colors.ink,
      fontVariant: ["tabular-nums"],
    },
    pointsPositive: {
      color: colors.positive,
    },
    pointsNegative: {
      color: colors.negative,
    },
    footer: {
      paddingVertical: 16,
      alignItems: "center",
    },
    footerSpacer: {
      height: 12,
    },
    footerText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.muted,
    },
    emptyRow: {
      paddingVertical: 22,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.muted,
    },
  });
}

const usePointsStyles = createThemedStyles(usePointsColors, buildPointsStyles);
