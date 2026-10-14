import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { CloseCircle, DocumentText1, SearchNormal1 } from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SoftPressable } from "../../components/SoftPressable";
import { headerSafeEdges } from "../../routes/headerSafeEdges";
import { SCREEN_GUTTER } from "../../theme/layout";
import type {
  LossDocumentSignatureFilter,
  MyLossDocumentListItem,
} from "../../services/inventoryAuditService";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { createThemedStyles } from "../../theme/themedStyles";
import { useAuditUi, type AuditUi } from "./audit/auditUi";
import { LossDocumentCard } from "./audit/LossDocumentCard";
import { useMyLossDocuments } from "./audit/useMyLossDocuments";

type SignatureTab = "all" | LossDocumentSignatureFilter;

const TABS: { key: SignatureTab; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendientes" },
  { key: "signed", label: "Firmadas" },
];

const PAGE_SIZE = 15;

function emptyCopy(tab: SignatureTab, search: string) {
  if (search) {
    return {
      title: "Sin resultados",
      text: `No encontramos actas para “${search}”. Prueba con el departamento, la marca, el almacén o el código de la auditoría.`,
    };
  }
  if (tab === "pending") {
    return {
      title: "Nada pendiente",
      text: "No tienes actas por firmar. Te avisaremos cuando te asignen una nueva.",
    };
  }
  if (tab === "signed") {
    return {
      title: "Aún sin firmas",
      text: "Cuando firmes un acta aparecerá aquí.",
    };
  }
  return {
    title: "Sin actas",
    text: "Cuando un administrador te asigne una pérdida, aquí verás las actas para revisarlas y firmarlas.",
  };
}

export default function AuditLossDocuments() {
  const navigation = useNavigation<any>();
  const ui = useAuditUi();
  const styles = useAuditDocsStyles();
  const [searchText, setSearchText] = useState("");
  const [tab, setTab] = useState<SignatureTab>("all");
  const search = useDebouncedValue(searchText.trim());
  const hasLoadedOnce = useRef(false);

  const {
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
  } = useMyLossDocuments(
    { search, signature: tab === "all" ? undefined : tab },
    PAGE_SIZE,
  );

  useFocusEffect(
    useCallback(() => {
      void fetchFirstPage(hasLoadedOnce.current ? "silent" : "initial");
      hasLoadedOnce.current = true;
    }, [fetchFirstPage]),
  );

  const openDocument = useCallback(
    (allocationId: string) => {
      navigation.navigate("InventoryAuditLossDocumentDetail", { allocationId });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: MyLossDocumentListItem }) => (
      <LossDocumentCard item={item} onPress={openDocument} />
    ),
    [openDocument],
  );

  const tabCount = (key: SignatureTab) =>
    key === "all" ? counts.pending + counts.signed : counts[key];

  const empty = emptyCopy(tab, search);
  const isSearching = fetching || searchText.trim() !== search;

  return (
    <SafeAreaView style={styles.safe} edges={headerSafeEdges("top", "left", "right")}>
      <HeaderTitle
        title="Mis actas"
        subtitle={
          counts.pending > 0
            ? `${counts.pending} ${counts.pending === 1 ? "acta pendiente" : "actas pendientes"} de firma`
            : "Revisa y firma tus actas de pérdida"
        }
        tone="light"
        style={styles.header}
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
      />

      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <SearchNormal1 size={18} color={ui.muted} variant="Linear" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar departamento, marca, almacén…"
            placeholderTextColor={ui.muted}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="never"
          />
          {isSearching && searchText.length > 0 ? (
            <ActivityIndicator size="small" color={ui.muted} />
          ) : searchText.length > 0 ? (
            <SoftPressable
              style={styles.searchClear}
              onPress={() => setSearchText("")}
              scaleTo={0.9}
              accessibilityLabel="Limpiar búsqueda"
            >
              <CloseCircle size={18} color={ui.muted} variant="Bold" />
            </SoftPressable>
          ) : null}
        </View>

        <View style={styles.tabs}>
          {TABS.map(({ key, label }) => {
            const active = tab === key;
            const count = tabCount(key);
            return (
              <SoftPressable
                key={key}
                style={styles.tabWrap}
                onPress={() => setTab(key)}
                scaleTo={0.96}
                accessibilityLabel={`${label}, ${count}`}
              >
                <View style={[styles.tab, active && styles.tabActive]}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {label}
                  </Text>
                  <View
                    style={[
                      styles.tabCount,
                      {
                        backgroundColor: active
                          ? "rgba(255,255,255,0.25)"
                          : key === "pending" && count > 0
                            ? ui.amberSoft
                            : ui.field,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabCountText,
                        {
                          color: active
                            ? "#FFFFFF"
                            : key === "pending" && count > 0
                              ? ui.amber
                              : ui.muted,
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </View>
              </SoftPressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ui.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.allocationId}
          renderItem={renderItem}
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void fetchFirstPage("refresh")}
              tintColor={ui.accent}
            />
          }
          style={fetching && !refreshing ? styles.listStale : undefined}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ItemGap}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            error ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No se pudieron cargar tus actas</Text>
                <SoftPressable
                  style={styles.retryWrap}
                  onPress={() => void fetchFirstPage("initial")}
                  scaleTo={0.97}
                >
                  <View style={styles.retryBtn}>
                    <Text style={styles.retryText}>Reintentar</Text>
                  </View>
                </SoftPressable>
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={[styles.emptyWell, { backgroundColor: ui.accentSoft }]}>
                  <DocumentText1 size={28} color={ui.accent} variant="Linear" />
                </View>
                <Text style={styles.emptyTitle}>{empty.title}</Text>
                <Text style={styles.emptyText}>{empty.text}</Text>
              </View>
            )
          }
          ListFooterComponent={
            items.length === 0 ? null : loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={ui.accent} />
              </View>
            ) : !hasMore ? (
              <Text style={styles.footerText}>
                {total} {total === 1 ? "acta" : "actas"} · no hay más
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function ItemGap() {
  return <View style={{ height: 12 }} />;
}

function buildAuditDocsStyles(ui: AuditUi) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: "transparent" },
    header: { paddingHorizontal: SCREEN_GUTTER },
    controls: {
      paddingHorizontal: SCREEN_GUTTER,
      paddingTop: 4,
      paddingBottom: 12,
      gap: 10,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: ui.field,
      borderRadius: 14,
      paddingHorizontal: 14,
      minHeight: 46,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      fontWeight: "500",
      color: ui.ink,
      paddingVertical: 10,
    },
    searchClear: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    tabs: { flexDirection: "row", gap: 8 },
    tabWrap: { width: "auto" },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingLeft: 14,
      paddingRight: 6,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: ui.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.divider,
    },
    tabActive: {
      backgroundColor: ui.accent,
      borderColor: ui.accent,
    },
    tabText: { fontSize: 13, fontWeight: "700", color: ui.ink },
    tabTextActive: { color: "#FFFFFF" },
    tabCount: {
      minWidth: 22,
      height: 22,
      paddingHorizontal: 6,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    tabCountText: { fontSize: 11, fontWeight: "800", fontVariant: ["tabular-nums"] },
    centered: { flex: 1, justifyContent: "center", alignItems: "center" },
    listStale: { opacity: 0.55 },
    listContent: {
      paddingHorizontal: SCREEN_GUTTER,
      paddingBottom: 36,
      flexGrow: 1,
    },
    footer: { paddingVertical: 20, alignItems: "center" },
    footerText: {
      paddingVertical: 20,
      textAlign: "center",
      fontSize: 12,
      fontWeight: "600",
      color: ui.muted,
    },
    empty: {
      alignItems: "center",
      paddingVertical: 48,
      paddingHorizontal: 28,
      gap: 8,
    },
    emptyWell: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: ui.ink,
      textAlign: "center",
    },
    emptyText: {
      fontSize: 14,
      fontWeight: "500",
      color: ui.muted,
      textAlign: "center",
      lineHeight: 20,
    },
    retryWrap: { width: "auto", marginTop: 8 },
    retryBtn: {
      backgroundColor: ui.accent,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 999,
    },
    retryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  });
}

const useAuditDocsStyles = createThemedStyles(useAuditUi, buildAuditDocsStyles);
