import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ProfileScreenHeader } from "../../components/ProfileScreenHeader";
import {
  ArrowUp,
  CloseCircle,
  SearchNormal1,
  TickCircle,
  Timer1,
} from "iconsax-react-native";
import {
  getFamilyAuditProducts,
  patchFamilyAuditCounts,
  type AuditDetailFamily,
  type AuditProductLine,
  type InventoryAuditStatus,
} from "../../services/inventoryAuditService";

const COLORS = {
  bg: "#F7F7F6",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  border: "#E5E7EB",
  accent: "#EA7600",
  green: "#16A34A",
  amber: "#D97706",
};

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

function formatApiError(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (Array.isArray(o.message)) return o.message.map(String).join(", ");
  }
  return "No se pudieron cargar los productos.";
}

function toCountInputValue(counted: number | null | undefined): string {
  if (counted === null || counted === undefined) return "";
  return counted <= 0 ? "" : String(counted);
}

function ProductRow({
  line,
  value,
  onChangeCount,
  disabled,
}: {
  line: AuditProductLine;
  value: string;
  onChangeCount: (text: string) => void;
  disabled?: boolean;
}) {
  const parsed = value.trim() === "" ? null : parseInt(value.trim(), 10);
  const validLocal = parsed !== null && Number.isFinite(parsed) && parsed >= 0;
  const done = line.counted !== null && line.counted !== undefined;
  const showDone = done || validLocal;

  return (
    <View style={[styles.productRow, disabled && styles.productRowDisabled]}>
      <View style={styles.productRowTop}>
        <View style={styles.productTitleBlock}>
          <Text style={styles.productSku} numberOfLines={1}>
            {line.product.sku}
          </Text>
          <Text style={styles.productName} numberOfLines={2}>
            {line.product.name}
          </Text>
        </View>
        {showDone ? (
          <TickCircle size={22} color={COLORS.green} variant="Bold" />
        ) : (
          <Timer1 size={22} color={COLORS.amber} variant="Linear" />
        )}
      </View>
      <View style={styles.countRow}>
        <Text style={styles.countLabel}>Cantidad contada</Text>
        <TextInput
          style={[styles.countInput, disabled && styles.inputDisabled]}
          value={value}
          onChangeText={(t) => onChangeCount(t.replace(/[^0-9]/g, ""))}
          placeholder="-"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          editable={!disabled}
          selectTextOnFocus
        />
      </View>
    </View>
  );
}

export default function InventoryAuditFamilyProducts() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { auditId, familyId, deptName, brandName } = route.params as {
    auditId: string;
    familyId: string;
    deptName?: string;
    brandName?: string;
  };

  const listRef = useRef<FlatList<AuditProductLine>>(null);

  const [lines, setLines] = useState<AuditProductLine[]>([]);
  const [family, setFamily] = useState<AuditDetailFamily | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [countsById, setCountsById] = useState<Record<string, string>>({});
  const [auditStatus, setAuditStatus] = useState<InventoryAuditStatus | null>(null);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const familyComplete = family?.status === "completed";
  const auditReadOnly =
    auditStatus === "pending_review" ||
    auditStatus === "finalized" ||
    auditStatus === "completed" ||
    auditStatus === "submitted";
  const inputsLocked = familyComplete || auditReadOnly;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    setCountsById({});
    setAuditStatus(null);
  }, [auditId, familyId, debouncedSearch]);

  useEffect(() => {
    setCountsById((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const l of lines) {
        if (next[l.id] === undefined) {
          next[l.id] = toCountInputValue(l.counted);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [lines]);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      const res = await getFamilyAuditProducts(auditId, familyId, {
        limit: PAGE_SIZE,
        offset,
        search: debouncedSearch || undefined,
      });
      setFamily(res.family);
      setAuditStatus(res.audit.status as InventoryAuditStatus);
      if (append) {
        setLines((prev) => [...prev, ...res.data]);
      } else {
        setLines(res.data);
      }
      offsetRef.current = offset + res.data.length;
      setTotal(res.total);
      hasMoreRef.current = offsetRef.current < res.total;
    },
    [auditId, familyId, debouncedSearch],
  );

  useEffect(() => {
    let cancelled = false;
    offsetRef.current = 0;
    hasMoreRef.current = true;
    setLoading(true);
    setError(null);
    setLines([]);
    (async () => {
      try {
        await fetchPage(0, false);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(formatApiError(e));
          setLines([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const buildPayload = useCallback(() => {
    const payload: { id: string; counted: number }[] = [];
    for (const l of lines) {
      const raw = countsById[l.id] ?? "";
      const trimmed = raw.trim();
      if (trimmed === "") continue;
      const n = parseInt(trimmed, 10);
      if (!Number.isFinite(n) || n < 0) continue;
      payload.push({ id: l.id, counted: n });
    }
    return payload;
  }, [lines, countsById]);

  const mergeSavedLines = useCallback((payload: { id: string; counted: number }[]) => {
    setLines((prev) =>
      prev.map((l) => {
        const p = payload.find((x) => x.id === l.id);
        if (!p) return l;
        const sys = l.systemStock ?? 0;
        return { ...l, counted: p.counted, difference: p.counted - sys };
      }),
    );
    setCountsById((prev) => {
      const next = { ...prev };
      for (const p of payload) {
        next[p.id] = toCountInputValue(p.counted);
      }
      return next;
    });
  }, []);

  const handleSaveProgress = useCallback(async () => {
    if (inputsLocked || saving) return;
    const payload = buildPayload();
    if (payload.length === 0) {
      Alert.alert("Sin cantidades", "Captura al menos una cantidad contada para guardar.");
      return;
    }
    setSaving(true);
    try {
      const res = await patchFamilyAuditCounts(auditId, familyId, {
        lines: payload,
        completeFamily: false,
      });
      setFamily(res.family);
      setAuditStatus(res.audit.status as InventoryAuditStatus);
      mergeSavedLines(payload);
      Alert.alert("Listo", "Progreso guardado.");
    } catch (e: unknown) {
      Alert.alert("Error", formatApiError(e));
    } finally {
      setSaving(false);
    }
  }, [
    auditId,
    familyId,
    buildPayload,
    mergeSavedLines,
    inputsLocked,
    saving,
  ]);

  const handleSaveFamily = useCallback(async () => {
    if (inputsLocked || saving) return;
    const payload = buildPayload();
    setSaving(true);
    try {
      const res = await patchFamilyAuditCounts(auditId, familyId, {
        lines: payload,
        completeFamily: true,
      });
      setFamily(res.family);
      setAuditStatus(res.audit.status as InventoryAuditStatus);
      if (payload.length > 0) mergeSavedLines(payload);
      Alert.alert("Marca completada", "El conteo de esta marca quedó cerrado.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: unknown) {
      Alert.alert("No se pudo completar", formatApiError(e));
    } finally {
      setSaving(false);
    }
  }, [
    auditId,
    familyId,
    buildPayload,
    mergeSavedLines,
    inputsLocked,
    saving,
    navigation,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    offsetRef.current = 0;
    hasMoreRef.current = true;
    try {
      await fetchPage(0, false);
    } catch (e: unknown) {
      setError(formatApiError(e));
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage]);

  const onEndReached = useCallback(async () => {
    if (!hasMoreRef.current || loading || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      await fetchPage(offsetRef.current, true);
    } catch {
      // Keep current list
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [fetchPage, loading]);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const headerTitle =
    deptName && brandName ? `${deptName} · ${brandName}` : "Productos de la marca";

  const pct =
    family && family.totalProducts > 0
      ? Math.round((family.countedProducts / family.totalProducts) * 100)
      : 0;

  const canCompleteFamily =
    !!family &&
    family.totalProducts > 0 &&
    family.countedProducts === family.totalProducts &&
    !familyComplete &&
    !auditReadOnly;

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.searchRow}>
        <SearchNormal1 size={16} color={COLORS.muted} variant="Linear" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por SKU o nombre"
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!inputsLocked}
        />
        {searchText.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchText("")} hitSlop={10} disabled={inputsLocked}>
            <CloseCircle size={16} color={COLORS.muted} variant="Linear" />
          </TouchableOpacity>
        ) : null}
      </View>
      {family ? (
        <>
          {familyComplete ? (
            <View style={styles.doneBanner}>
              <Text style={styles.doneBannerText}>Esta marca ya está completada (solo lectura).</Text>
            </View>
          ) : null}
          {auditReadOnly && !familyComplete ? (
            <View style={styles.auditLockedBanner}>
              <Text style={styles.auditLockedBannerText}>
                La auditoría está pendiente de revisión o finalizada; no se pueden guardar cambios.
              </Text>
            </View>
          ) : null}
          <View style={styles.progressBlock}>
            <View style={styles.progressHeadRow}>
              <Text style={styles.progressMain}>
                <Text style={styles.progressStrong}>{family.countedProducts}</Text>
                <Text style={styles.progressMuted}>/{family.totalProducts}</Text>
                <Text style={styles.progressMuted}> productos</Text>
              </Text>
              <View style={styles.progressPctPill}>
                <Text style={styles.progressPctText}>{pct}%</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
          </View>
          <Text style={styles.totalHint}>
            {debouncedSearch
              ? `${total} resultado${total !== 1 ? "s" : ""} para “${debouncedSearch}”`
              : `Mostrando ${lines.length} de ${total} en esta marca`}
          </Text>
        </>
      ) : null}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ProfileScreenHeader title="Conteo" subtitle={headerTitle} />

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.btnProgress, (saving || inputsLocked) && styles.btnDisabled]}
          onPress={handleSaveProgress}
          disabled={saving || inputsLocked}
        >
          {saving ? (
            <ActivityIndicator color="#EA7600" size="small" />
          ) : (
            <Text style={styles.btnProgressText}>Guardar progreso</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.btnComplete,
            (saving || inputsLocked || !canCompleteFamily) && styles.btnDisabled,
          ]}
          onPress={handleSaveFamily}
          disabled={saving || inputsLocked || !canCompleteFamily}
        >
          <Text style={styles.btnCompleteText}>Guardar ubicación</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <>
          <FlatList
            ref={listRef}
            data={lines}
            keyExtractor={(item) => item.id}
            extraData={[countsById, family, inputsLocked]}
            renderItem={({ item }) => (
              <ProductRow
                line={item}
                value={countsById[item.id] ?? ""}
                onChangeCount={(text) =>
                  setCountsById((p) => ({
                    ...p,
                    [item.id]: text,
                  }))
                }
                disabled={inputsLocked}
              />
            )}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
            }
            onEndReached={onEndReached}
            onEndReachedThreshold={0.35}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {error
                    ? "Sin datos"
                    : debouncedSearch
                      ? `Nada coincide con “${debouncedSearch}”.`
                      : "No hay productos en esta marca."}
                </Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator color={COLORS.accent} />
                </View>
              ) : null
            }
          />
          {!loading && lines.length > 0 ? (
            <TouchableOpacity
              style={styles.fab}
              onPress={scrollToTop}
              activeOpacity={0.9}
              accessibilityLabel="Ir arriba"
            >
              <ArrowUp size={22} color="#FFFFFF" variant="Linear" />
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  actionBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  btnProgress: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  btnProgressText: { fontSize: 13, fontWeight: "800", color: COLORS.accent },
  btnComplete: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  btnCompleteText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
  btnDisabled: { opacity: 0.45 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  listHeader: { paddingTop: 10, paddingBottom: 6 },
  doneBanner: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  doneBannerText: { fontSize: 12, fontWeight: "700", color: "#15803D" },
  auditLockedBanner: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  auditLockedBannerText: { fontSize: 12, fontWeight: "700", color: "#3730A3" },
  progressBlock: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  progressHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressMain: { fontSize: 13, fontWeight: "700", color: COLORS.text, flex: 1, paddingRight: 8 },
  progressStrong: { fontWeight: "900", color: COLORS.text },
  progressMuted: { fontWeight: "600", color: COLORS.muted },
  progressPctPill: {
    backgroundColor: "#FFF4E8",
    borderWidth: 1,
    borderColor: "#FDBA74",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 2,
    minWidth: 42,
    alignItems: "center",
  },
  progressPctText: { fontSize: 11, fontWeight: "900", color: COLORS.accent },
  progressTrack: {
    height: 6,
    backgroundColor: "#E8EDF5",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: COLORS.accent, borderRadius: 999 },
  totalHint: { fontSize: 11, color: "#9CA3AF", marginBottom: 8 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
    minHeight: 20,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
  },
  errorText: { fontSize: 12, color: "#B91C1C" },
  productRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDF1F6",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  productRowDisabled: { opacity: 0.85 },
  productRowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  productTitleBlock: { flex: 1, minWidth: 0 },
  productSku: {
    alignSelf: "flex-start",
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.accent,
    letterSpacing: 0.4,
    backgroundColor: "#FFF4E8",
    borderWidth: 1,
    borderColor: "#FDBA74",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: "hidden",
  },
  productName: { fontSize: 13, fontWeight: "800", color: COLORS.text, marginTop: 6, lineHeight: 17 },
  countRow: { marginTop: 12 },
  countLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.muted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  countInput: {
    borderWidth: 1,
    borderColor: "#E8EDF5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    backgroundColor: "#F8FAFC",
  },
  inputDisabled: { backgroundColor: "#F1F4F9", color: COLORS.muted },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: COLORS.muted, fontSize: 14 },
  footerLoading: { paddingVertical: 20 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
