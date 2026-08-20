import { useCallback, useMemo, useState } from "react";
import pointsSource from "./pointsDemo.json";
import {
  buildLedger,
  type PointsBalance,
  type PointsLedgerRow,
  type PointsMovement,
} from "../pointsTypes";

const PAGE_SIZE = 8;
const FETCH_DELAY_MS = 650;
const HISTORY_CYCLES = 5;
const OLDER_DATE_LABELS = [
  "12 ago, 05:40 PM",
  "08 ago, 11:15 AM",
  "01 ago, 04:02 PM",
  "25 jul, 09:48 AM",
  "18 jul, 06:30 PM",
];

const SEED_MOVEMENTS = pointsSource.movements as PointsMovement[];

function shiftReference(reference: string, offset: number): string {
  const [prefix, digits] = reference.split("-");
  if (!digits) return reference;
  const next = Math.max(0, Number(digits) - offset);
  return `${prefix}-${String(next).padStart(digits.length, "0")}`;
}

function buildDemoMovements(): PointsMovement[] {
  const history: PointsMovement[] = [];

  for (let cycle = 1; cycle <= HISTORY_CYCLES; cycle += 1) {
    SEED_MOVEMENTS.forEach((movement, index) => {
      history.push({
        ...movement,
        id: `${movement.id}-h${cycle}`,
        reference: shiftReference(movement.reference, cycle * 20 + index),
        dateLabel: OLDER_DATE_LABELS[(cycle - 1) % OLDER_DATE_LABELS.length],
        range: "older",
      });
    });
  }

  return [...SEED_MOVEMENTS, ...history];
}

const ALL_MOVEMENTS = buildDemoMovements();
const TOTAL_POINTS = ALL_MOVEMENTS.reduce(
  (sum, movement) => sum + movement.points,
  0,
);
const ALL_ROWS = buildLedger(ALL_MOVEMENTS, TOTAL_POINTS);

const BALANCE: PointsBalance = {
  total: TOTAL_POINTS,
  expiresLabel: pointsSource.balance.expiresLabel,
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type PointsDemoController = {
  balance: PointsBalance;
  rows: PointsLedgerRow[];
  hasMore: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
};

export function usePointsDemo(): PointsDemoController {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const hasMore = visibleCount < ALL_ROWS.length;

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    void (async () => {
      setLoadingMore(true);
      await wait(FETCH_DELAY_MS);
      setVisibleCount((count) => Math.min(ALL_ROWS.length, count + PAGE_SIZE));
      setLoadingMore(false);
    })();
  }, [hasMore, loadingMore]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await wait(FETCH_DELAY_MS);
      setVisibleCount(PAGE_SIZE);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const rows = useMemo(() => ALL_ROWS.slice(0, visibleCount), [visibleCount]);

  return {
    balance: BALANCE,
    rows,
    hasMore,
    loadingMore,
    refreshing,
    loadMore,
    refresh,
  };
}
