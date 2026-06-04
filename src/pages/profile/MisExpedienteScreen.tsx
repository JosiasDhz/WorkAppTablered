import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ArrowRight2, FolderOpen } from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import {
  getMyExpediente,
  type ExpedienteDocumentSummaryItemDto,
  type SellerExpedienteDto,
} from "../../services/workforceExpedienteService";

const COLORS = {
  bg: "#F7F7F6",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  border: "#E5E7EB",
  accent: "#EA7600",
  completeBg: "#ECFDF3",
  completeText: "#16A34A",
  pendingBg: "#FFF4EB",
  pendingText: "#EA7600",
};

function fileCountLabel(count: number) {
  if (count === 0) return "Sin archivos";
  if (count === 1) return "1 archivo";
  return `${count} archivos`;
}

export default function MisExpedienteScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [data, setData] = useState<SellerExpedienteDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await getMyExpediente();
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const openDocument = (doc: ExpedienteDocumentSummaryItemDto) => {
    navigation.navigate("MisExpedienteDocumento", {
      documentTypeId: doc.documentTypeId,
      documentTypeName: doc.documentTypeName,
      isRequired: doc.isRequired,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <HeaderTitle
        title="Mi expediente"
        tone="light"
        onBack={() => navigation.goBack()}
      />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : !data ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>No se pudo cargar tu expediente.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(tabBarHeight, insets.bottom) + 24,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.accent}
            />
          }
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <FolderOpen size={22} color={COLORS.accent} variant="Linear" />
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>Estado del expediente</Text>
              <Text style={styles.summarySub}>
                Obligatorios {data.requiredUploaded}/{data.requiredTotal} · Opcionales{" "}
                {data.optionalUploaded}/{data.optionalTotal}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: data.isComplete
                    ? COLORS.completeBg
                    : COLORS.pendingBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: data.isComplete ? COLORS.completeText : COLORS.pendingText,
                  },
                ]}
              >
                {data.isComplete ? "Completo" : "Pendiente"}
              </Text>
            </View>
          </View>

          {data.documents.map((doc) => (
            <Pressable
              key={doc.documentTypeId}
              style={styles.docCard}
              onPress={() => openDocument(doc)}
            >
              <View style={styles.docMain}>
                <View style={styles.docHeader}>
                  <Text style={styles.docTitle}>{doc.documentTypeName}</Text>
                  {doc.isRequired ? (
                    <Text style={styles.requiredTag}>Obligatorio</Text>
                  ) : (
                    <Text style={styles.optionalTag}>Opcional</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.docCount,
                    doc.fileCount === 0 ? styles.docCountEmpty : null,
                  ]}
                >
                  {fileCountLabel(doc.fileCount)}
                </Text>
              </View>
              <ArrowRight2 size={18} color={COLORS.muted} variant="Linear" />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: "center",
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFF4EB",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryText: { flex: 1 },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  summarySub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 10,
  },
  docMain: { flex: 1, minWidth: 0 },
  docHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  requiredTag: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.pendingText,
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
  },
  docCount: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
  },
  docCountEmpty: {
    color: COLORS.pendingText,
  },
});
