import { useCallback, useRef, useState } from "react";
import {
  getMyLossDocuments,
  type LossDocumentSignatureFilter,
  type MyLossDocumentListItem,
} from "../../../services/inventoryAuditService";

type Counts = Record<LossDocumentSignatureFilter, number>;

const EMPTY_COUNTS: Counts = { pending: 0, signed: 0 };

export function useMyLossDocuments(
  filters: { search: string; signature?: LossDocumentSignatureFilter },
  pageSize = 15,
) {
  const [items, setItems] = useState<MyLossDocumentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);
  const offsetRef = useRef(0);

  const search = filters.search.trim();
  const signature = filters.signature;

  const fetchFirstPage = useCallback(
    async (mode: "initial" | "refresh" | "silent") => {
      const id = ++requestId.current;
      setFetching(true);
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      try {
        const res = await getMyLossDocuments({
          limit: pageSize,
          offset: 0,
          search: search || undefined,
          signature,
        });
        if (id !== requestId.current) return;
        const data = res.data ?? [];
        setItems(data);
        setTotal(res.total ?? data.length);
        setCounts(res.counts ?? EMPTY_COUNTS);
        offsetRef.current = data.length;
        setError(false);
      } catch {
        if (id !== requestId.current) return;
        setError(true);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          setFetching(false);
        }
      }
    },
    [pageSize, search, signature],
  );

  const hasMore = items.length < total;

  const loadMore = useCallback(async () => {
    if (loading || refreshing || fetching || loadingMore || !hasMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const res = await getMyLossDocuments({
        limit: pageSize,
        offset: offsetRef.current,
        search: search || undefined,
        signature,
      });
      if (id !== requestId.current) return;
      const data = res.data ?? [];
      setItems((current) => {
        const seen = new Set(current.map((it) => it.allocationId));
        return [...current, ...data.filter((it) => !seen.has(it.allocationId))];
      });
      offsetRef.current += data.length;
      setTotal(res.total ?? total);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [
    fetching,
    hasMore,
    loading,
    loadingMore,
    pageSize,
    refreshing,
    search,
    signature,
    total,
  ]);

  return {
    items,
    total,
    counts,
    loading,
    refreshing,
    loadingMore,
    fetching,
    hasMore,
    error,
    fetchFirstPage,
    loadMore,
  };
}
