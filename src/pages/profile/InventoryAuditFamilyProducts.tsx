import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SoftPressable } from "../../components/SoftPressable";
import { headerSafeEdges } from "../../routes/headerSafeEdges";
import { SCREEN_GUTTER } from "../../theme/layout";
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
  auditFamilyDisplayLabel,
  type AuditDetailFamily,
  type AuditProductLine,
  type InventoryAuditStatus,
} from "../../services/inventoryAuditService";
import { createThemedStyles } from "../../theme/themedStyles";
import { auditSoftCardStyle, useAuditUi, type AuditUi } from "./audit/auditUi";

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
  const ui = useAuditUi();
  const styles = useFamilyProductStyles();
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
          <TickCircle size={22} color={ui.green} variant="Bold" />
        ) : (
          <Timer1 size={22} color={ui.amber} variant="Linear" />
        )}
      </View>
      <View style={styles.countRow}>
        <Text style={styles.countLabel}>Cantidad contada</Text>
        <TextInput
          style={[styles.countInput, disabled && styles.inputDisabled]}
          value={value}
          onChangeText={(t) => onChangeCount(t.replace(/[^0-9]/g, ""))}
          placeholder="-"
          placeholderTextColor={ui.muted}
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
  const ui = useAuditUi();
  const styles = useFamilyProductStyles();
  const { auditId, familyId, locationLabel } = route.params as {
    auditId: string;
    familyId: string;
    locationLabel?: string;
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
      Alert.alert("Ubicación completada", "El conteo de esta ubicación quedó cerrado.", [
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
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [fetchPage, loading]);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const headerTitle =
    locationLabel ??
    (family ? auditFamilyDisplayLabel(family) : "Productos de la ubicación");

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
        <SearchNormal1 size={16} color={ui.muted} variant="Linear" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por SKU o nombre"
          placeholderTextColor={ui.muted}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!inputsLocked}
        />
        {searchText.length > 0 ? (
          <SoftPressable
            style={styles.searchClear}
            onPress={() => setSearchText("")}
            disabled={inputsLocked}
            scaleTo={0.95}
            accessibilityLabel="Limpiar búsqueda"
          >
            <CloseCircle size={16} color={ui.muted} variant="Linear" />
          </SoftPressable>
        ) : null}
      </View>
      {family ? (
        <>
          {familyComplete ? (
            <View style={styles.doneBanner}>
              <Text style={styles.doneBannerText}>Esta ubicación ya está completada (solo lectura).</Text>
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
              : `Mostrando ${lines.length} de ${total} en esta ubicación`}
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
    <SafeAreaView style={styles.safe} edges={headerSafeEdges("top", "left", "right")}>
      <HeaderTitle
        title="Conteo"
        subtitle={headerTitle}
        tone="light"
        style={styles.header}
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
      />

      <View style={styles.actionBar}>
        <View style={styles.actionSlot}>
          <SoftPressable
            onPress={handleSaveProgress}
            disabled={saving || inputsLocked}
            scaleTo={0.98}
            style={(saving || inputsLocked) ? styles.btnDisabled : undefined}
          >
            <View style={styles.btnProgress}>
              {saving ? (
                <ActivityIndicator color={ui.accent} size="small" />
              ) : (
                <Text style={styles.btnProgressText}>Guardar progreso</Text>
              )}
            </View>
          </SoftPressable>
        </View>
        <View style={styles.actionSlot}>
          <SoftPressable
            onPress={handleSaveFamily}
            disabled={saving || inputsLocked || !canCompleteFamily}
            scaleTo={0.98}
            style={
              saving || inputsLocked || !canCompleteFamily
                ? styles.btnDisabled
                : undefined
            }
          >
            <View style={styles.btnComplete}>
              <Text style={styles.btnCompleteText}>Guardar ubicación</Text>
            </View>
          </SoftPressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ui.accent} />
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
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.accent} />
            }
            onEndReached={onEndReached}
            onEndReachedThreshold={0.35}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {error
                    ? "Sin datos"
                    : debouncedSearch
                      ? `Nada coincide con “${debouncedSearch}”.`
                      : "No hay productos en esta ubicación."}
                </Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator color={ui.accent} />
                </View>
              ) : null
            }
          />
          {!loading && lines.length > 0 ? (
            <View style={styles.fabAnchor}>
              <SoftPressable
                style={styles.fab}
                onPress={scrollToTop}
                scaleTo={0.94}
                accessibilityLabel="Ir arriba"
              >
                <ArrowUp size={22} color="#FFFFFF" variant="Linear" />
              </SoftPressable>
            </View>
          ) : null}
        </>
      )}
    </SafeAreaView>
  );
}

function buildFamilyProductStyles(ui: AuditUi) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: "transparent" },
    header: { paddingHorizontal: SCREEN_GUTTER },
    actionBar: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: SCREEN_GUTTER,
      paddingVertical: 10,
      backgroundColor: "transparent",
    },
    actionSlot: { flex: 1 },
    btnProgress: {
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(234, 118, 0, 0.45)",
      backgroundColor: ui.surface,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 44,
    },
    btnProgressText: { fontSize: 13, fontWeight: "700", color: ui.accent },
    btnComplete: {
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: ui.accent,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 44,
    },
    btnCompleteText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
    btnDisabled: { opacity: 0.45 },
    centered: { flex: 1, justifyContent: "center", alignItems: "center" },
    listContent: { paddingHorizontal: SCREEN_GUTTER, paddingBottom: 100 },
    listHeader: { paddingTop: 4, paddingBottom: 6 },
    doneBanner: {
      backgroundColor: ui.greenSoft,
      borderRadius: 14,
      padding: 10,
      marginBottom: 10,
    },
    doneBannerText: { fontSize: 12, fontWeight: "600", color: ui.green },
    auditLockedBanner: {
      backgroundColor: ui.blueSoft,
      borderRadius: 14,
      padding: 10,
      marginBottom: 8,
    },
    auditLockedBannerText: { fontSize: 12, fontWeight: "600", color: ui.blue },
    progressBlock: {
      ...auditSoftCardStyle(ui),
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
    progressMain: {
      fontSize: 13,
      fontWeight: "600",
      color: ui.ink,
      flex: 1,
      paddingRight: 8,
    },
    progressStrong: { fontWeight: "800", color: ui.ink },
    progressMuted: { fontWeight: "500", color: ui.muted },
    progressPctPill: {
      backgroundColor: ui.accentSoft,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 3,
      minWidth: 42,
      alignItems: "center",
    },
    progressPctText: { fontSize: 11, fontWeight: "800", color: ui.accent },
    progressTrack: {
      height: 6,
      backgroundColor: ui.field,
      borderRadius: 999,
      overflow: "hidden",
    },
    progressFill: { height: "100%", backgroundColor: ui.accent, borderRadius: 999 },
    totalHint: { fontSize: 12, fontWeight: "500", color: ui.muted, marginBottom: 8 },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: ui.field,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: ui.ink,
      paddingVertical: 0,
      minHeight: 20,
    },
    searchClear: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    errorBanner: {
      backgroundColor: ui.roseSoft,
      borderRadius: 14,
      padding: 10,
      marginTop: 4,
    },
    errorText: { fontSize: 12, fontWeight: "600", color: ui.rose },
    productRow: {
      ...auditSoftCardStyle(ui),
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 10,
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
      fontWeight: "800",
      color: ui.accent,
      letterSpacing: 0.4,
      backgroundColor: ui.accentSoft,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      overflow: "hidden",
    },
    productName: {
      fontSize: 14,
      fontWeight: "600",
      color: ui.ink,
      marginTop: 6,
      lineHeight: 18,
    },
    countRow: { marginTop: 12 },
    countLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: ui.muted,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    countInput: {
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 18,
      fontWeight: "600",
      color: ui.ink,
      backgroundColor: ui.field,
    },
    inputDisabled: { opacity: 0.7, color: ui.muted },
    empty: { paddingVertical: 40, alignItems: "center" },
    emptyText: { color: ui.muted, fontSize: 14, fontWeight: "500" },
    footerLoading: { paddingVertical: 20 },
    fabAnchor: {
      position: "absolute",
      right: SCREEN_GUTTER,
      bottom: 28,
    },
    fab: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: ui.accent,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: ui.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 10,
      elevation: 6,
    },
  });
}

const useFamilyProductStyles = createThemedStyles(
  useAuditUi,
  buildFamilyProductStyles,
);
