import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ArrowRight2 } from "iconsax-react-native";
import { ProfileScreenHeader } from "../../components/ProfileScreenHeader";
import {
  getMyLossDocuments,
  auditFamilyDisplayLabel,
  type MyLossDocumentItem,
} from "../../services/inventoryAuditService";
import { formatInventoryAuditCalendarDateMX, parseInventoryAuditCalendarDate } from "../../utils/auditCalendarDates";

const COLORS = {
  bg: "#F7F7F6",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  border: "#EEF1F4",
  accent: "#EA7600",
  red: "#B91C1C",
};

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
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ProfileScreenHeader title="Actas" subtitle="Documentos y montos asignados a ti" />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(it) => it.auditId}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 128,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
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

            return (
              <View style={styles.groupCard}>
                <View style={styles.groupHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupTitle} numberOfLines={1}>
                      Auditoría {group.auditId.slice(0, 8).toUpperCase()}
                    </Text>
                    <Text style={styles.groupMeta} numberOfLines={1}>
                      {group.warehouseName} · {formatDateShort(group.scheduledStartDate)} -{" "}
                      {formatDateShort(group.scheduledEndDate)}
                    </Text>
                  </View>
                  <View style={styles.groupBadge}>
                    <Text style={styles.groupBadgeText}>{statusLabel(group.status)}</Text>
                  </View>
                </View>

                <View style={styles.groupStats}>
                  <Text style={styles.groupStatsText}>
                    {group.items.length} familias · {totalDocs} actas
                  </Text>
                </View>

                <View style={styles.groupBody}>
                  {group.items.map((docItem) => {
                    const docsLabel = [
                      docItem.generateContract ? "Acta inventario" : null,
                      docItem.generatePaymentForm ? "Acta entrega" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ");

                    return (
                      <TouchableOpacity
                        key={docItem.allocationId}
                        activeOpacity={0.9}
                        style={styles.familyCard}
                        onPress={() =>
                          navigation.navigate("InventoryAuditLossDocumentDetail", {
                            allocationId: docItem.allocationId,
                          })
                        }
                      >
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {auditFamilyDisplayLabel(docItem.family)}
                        </Text>
                        <Text style={styles.cardAmount}>{formatMoney(docItem.amount)}</Text>
                        <Text style={styles.cardHint}>
                          {docsLabel || "Sin actas disponibles"}
                        </Text>
                        <View style={styles.cardRow}>
                          <Text style={styles.cardLink}>Ver actas</Text>
                          <ArrowRight2 size={18} color={COLORS.accent} variant="Linear" />
                        </View>
                      </TouchableOpacity>
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
  safe: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: {
    paddingVertical: 40,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  groupCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    overflow: "hidden",
  },
  groupHead: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
  },
  groupMeta: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
  },
  groupBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FED7AA",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#C2410C",
  },
  groupStats: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFBEB",
    borderBottomWidth: 1,
    borderBottomColor: "#FEF3C7",
  },
  groupStatsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A16207",
  },
  groupBody: {
    padding: 10,
    gap: 8,
  },
  familyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  cardAmount: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.red,
  },
  cardHint: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
  },
  cardRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLink: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.accent,
  },
});
