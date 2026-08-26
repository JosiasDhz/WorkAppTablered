import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ArrowRight2, DocumentText1 } from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SoftPressable } from "../../components/SoftPressable";
import { headerSafeEdges } from "../../routes/headerSafeEdges";
import { SCREEN_GUTTER } from "../../theme/layout";
import {
  getMyLossDocuments,
  auditFamilyDisplayLabel,
  type MyLossDocumentItem,
} from "../../services/inventoryAuditService";
import { formatInventoryAuditCalendarDateMX, parseInventoryAuditCalendarDate } from "../../utils/auditCalendarDates";
import { AUDIT_UI, auditSoftCardStyle } from "./audit/auditUi";

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(n);
}

function formatDateShort(dateStr: string) {
  return formatInventoryAuditCalendarDateMX(dateStr);
}

type LossDocsGroup = {
  auditId: string;
  warehouseName: string;
  scheduledStartDate: string;
  scheduledEndDate: string;
  status: string;
  items: MyLossDocumentItem[];
};

function statusLabel(status: string) {
  if (status === "pending_responsibility") return "Asignando responsables";
  if (status === "finalized") return "Finalizada";
  if (status === "pending_review") return "Pendiente revisión";
  return "En proceso";
}

function statusTone(status: string) {
  if (status === "finalized") {
    return { color: AUDIT_UI.green, soft: AUDIT_UI.greenSoft };
  }
  if (status === "pending_responsibility" || status === "pending_review") {
    return { color: AUDIT_UI.amber, soft: AUDIT_UI.amberSoft };
  }
  return { color: AUDIT_UI.accent, soft: AUDIT_UI.accentSoft };
}

export default function AuditLossDocuments() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<MyLossDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getMyLossDocuments();
      setItems(res.data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const groups = useMemo<LossDocsGroup[]>(() => {
    const grouped = new Map<string, LossDocsGroup>();
    for (const item of items) {
      const key = item.audit.id;
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          auditId: item.audit.id,
          warehouseName: item.audit.warehouse?.name ?? "Sin almacén",
          scheduledStartDate: item.audit.scheduledStartDate,
          scheduledEndDate: item.audit.scheduledEndDate,
          status: item.audit.status,
          items: [item],
        });
      } else {
        existing.items.push(item);
      }
    }

    const groupedList = Array.from(grouped.values())
      .map((group) => ({
        ...group,
        items: [...group.items].sort((a, b) => {
          const aKey = auditFamilyDisplayLabel(a.family);
          const bKey = auditFamilyDisplayLabel(b.family);
          return aKey.localeCompare(bKey, "es-MX");
        }),
      }))
      .sort(
        (a, b) =>
          parseInventoryAuditCalendarDate(b.scheduledStartDate).getTime() -
          parseInventoryAuditCalendarDate(a.scheduledStartDate).getTime()
      );

    return groupedList;
  }, [items]);

  return (
    <SafeAreaView style={styles.safe} edges={headerSafeEdges("top", "left", "right")}>
      <HeaderTitle
        title="Actas"
        subtitle="Documentos y montos asignados a ti"
        tone="light"
        style={styles.header}
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
      />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AUDIT_UI.accent} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(it) => it.auditId}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AUDIT_UI.accent} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyWell, { backgroundColor: AUDIT_UI.accentSoft }]}>
                <DocumentText1 size={28} color={AUDIT_UI.accent} variant="Linear" />
              </View>
              <Text style={styles.emptyTitle}>Sin registros</Text>
              <Text style={styles.emptyText}>
                Cuando un administrador te asigne documentos, aquí verás las actas agrupadas por
                auditoría para revisarlas y firmarlas.
              </Text>
            </View>
          }
          renderItem={({ item: group }) => {
            const totalDocs = group.items.reduce(
              (sum, it) =>
                sum + (it.generateContract ? 1 : 0) + (it.generatePaymentForm ? 1 : 0),
              0
            );
            const tone = statusTone(group.status);

            return (
              <View style={styles.groupCard}>
                <View style={styles.groupHead}>
                  <View style={[styles.iconWell, { backgroundColor: tone.soft }]}>
                    <DocumentText1 size={20} color={tone.color} variant="Linear" />
                  </View>
                  <View style={styles.groupCopy}>
                    <Text style={styles.groupTitle} numberOfLines={1}>
                      Auditoría {group.auditId.slice(0, 8).toUpperCase()}
                    </Text>
                    <Text style={styles.groupMeta} numberOfLines={1}>
                      {group.warehouseName} · {formatDateShort(group.scheduledStartDate)} -{" "}
                      {formatDateShort(group.scheduledEndDate)}
                    </Text>
                  </View>
                  <View style={[styles.groupBadge, { backgroundColor: tone.soft }]}>
                    <Text style={[styles.groupBadgeText, { color: tone.color }]}>
                      {statusLabel(group.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.groupStatsText}>
                  {group.items.length} familias · {totalDocs} actas
                </Text>

                <View style={styles.groupBody}>
                  {group.items.map((docItem) => {
                    const docsLabel = [
                      docItem.generateContract ? "Acta inventario" : null,
                      docItem.generatePaymentForm ? "Acta entrega" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ");

                    return (
                      <SoftPressable
                        key={docItem.allocationId}
                        scaleTo={0.99}
                        style={styles.familyCardWrap}
                        accessibilityLabel={auditFamilyDisplayLabel(docItem.family)}
                        onPress={() =>
                          navigation.navigate("InventoryAuditLossDocumentDetail", {
                            allocationId: docItem.allocationId,
                          })
                        }
                      >
                        <View style={styles.familyCard}>
                          <Text style={styles.cardTitle} numberOfLines={2}>
                            {auditFamilyDisplayLabel(docItem.family)}
                          </Text>
                          <Text style={styles.cardAmount}>{formatMoney(docItem.amount)}</Text>
                          <Text style={styles.cardHint}>
                            {docsLabel || "Sin actas disponibles"}
                          </Text>
                          <View style={styles.cardRow}>
                            <Text style={styles.cardLink}>Ver actas</Text>
                            <ArrowRight2 size={16} color={AUDIT_UI.muted} variant="Linear" />
                          </View>
                        </View>
                      </SoftPressable>
                    );
                  })}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  header: { paddingHorizontal: SCREEN_GUTTER },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 4,
    paddingBottom: 36,
    flexGrow: 1,
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
    color: AUDIT_UI.ink,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    color: AUDIT_UI.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  groupCard: {
    ...auditSoftCardStyle(),
    marginBottom: 12,
    padding: 14,
  },
  groupHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  groupCopy: { flex: 1, minWidth: 0 },
  groupTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: AUDIT_UI.ink,
  },
  groupMeta: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "500",
    color: AUDIT_UI.muted,
  },
  groupBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  groupStatsText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: AUDIT_UI.muted,
  },
  groupBody: {
    marginTop: 10,
    gap: 8,
  },
  familyCardWrap: {
    marginBottom: 0,
  },
  familyCard: {
    backgroundColor: AUDIT_UI.field,
    borderRadius: 14,
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: AUDIT_UI.ink,
  },
  cardAmount: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
    color: AUDIT_UI.rose,
  },
  cardHint: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
    color: AUDIT_UI.muted,
  },
  cardRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLink: {
    fontSize: 13,
    fontWeight: "700",
    color: AUDIT_UI.accent,
  },
});
