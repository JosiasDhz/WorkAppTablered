import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SlideToStartAudit } from "../../components/SlideToStartAudit";
import type { RootStackParamList } from "../../routes/RootStackParamList";
import { getDriverRouteAssignmentDetail } from "./driverDemo/resolveDriverRouteAssignmentDetail";
import {
  buildPickupLinesLifoFromAssignment,
  groupPickupLinesByDestinationInOrder,
} from "./driverRoute/pickupLinesFromAssignment";

function parseQty(raw: string): number {
  const n = Number.parseInt(raw.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function emptyQtyMap(recordIds: string[]): Record<string, string> {
  const o: Record<string, string> = {};
  for (const id of recordIds) {
    o[id] = "";
  }
  return o;
}

export default function DriverRouteProductPickupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } =
    useRoute<RouteProp<RootStackParamList, "DriverRouteProductPickup">>();
  const routeId = params?.routeId ?? "";
  const detail = useMemo(() => getDriverRouteAssignmentDetail(routeId), [routeId]);

  const lines = useMemo(
    () => (detail ? buildPickupLinesLifoFromAssignment(detail) : []),
    [detail],
  );

  const [loadedByRecordId, setLoadedByRecordId] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoadedByRecordId(emptyQtyMap(lines.map((l) => l.recordId)));
  }, [lines]);

  const groups = useMemo(() => groupPickupLinesByDestinationInOrder(lines), [lines]);

  const allPickupCounted = useMemo(() => {
    if (lines.length === 0) return false;
    return lines.every((line) => {
      const raw = (loadedByRecordId[line.recordId] ?? "").trim();
      if (!/\d/.test(raw)) return false;
      const p = parseQty(raw);
      return p >= 1 && p <= line.expectedQty;
    });
  }, [lines, loadedByRecordId]);

  const dockBottomPad = Math.max(insets.bottom, 12);
  const routeSwipeDockH = 88 + dockBottomPad;

  const onStartRoute = useCallback(async () => {
    navigation.navigate("DriverRouteNavFirstStop", { routeId });
  }, [navigation, routeId]);

  const setQty = useCallback((recordId: string, text: string) => {
    setLoadedByRecordId((prev) => ({ ...prev, [recordId]: text }));
  }, []);

  if (!detail) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <HeaderTitle title="Levantamiento" subtitle="Sin datos de ruta" tone="light" />
        <View style={styles.missing}>
          <Text style={styles.missingTxt}>No hay ruta para contar productos.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { route } = detail;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.shell}>
        <HeaderTitle
          title="Levantamiento de productos"
          subtitle={route.folio}
          tone="light"
        />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollPad,
              { paddingBottom: allPickupCounted ? routeSwipeDockH + 20 : 40 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
          {groups.map((g) => (
            <View key={g.destinationId} style={styles.group}>
              <View style={styles.groupHead}>
                <View style={styles.badge}>
                  <Text style={styles.badgeTxt}>{g.visitOrder}</Text>
                </View>
                <Text style={styles.groupTitle} numberOfLines={3}>
                  {g.stopTitle}
                </Text>
              </View>
              {g.lines.map((line) => {
                const raw = loadedByRecordId[line.recordId] ?? "";
                const parsed = parseQty(raw);
                const over = parsed > line.expectedQty;
                return (
                  <View key={line.recordId} style={styles.lineCard}>
                    <Text style={styles.prodName} numberOfLines={4}>
                      {line.productName}
                    </Text>
                    <Text style={styles.folio}>{line.saleFolio}</Text>
                    <View style={styles.qtyRow}>
                      <View style={styles.qtyCol}>
                        <Text style={styles.qtyLbl}>En ruta</Text>
                        <Text style={styles.qtyExpected}>{line.expectedQty}</Text>
                      </View>
                      <View style={[styles.qtyCol, styles.qtyColInput]}>
                        <Text style={styles.qtyLbl}>Cargado</Text>
                        <TextInput
                          value={raw}
                          onChangeText={(t) => setQty(line.recordId, t)}
                          placeholder="-"
                          placeholderTextColor="#94A3B8"
                          keyboardType="number-pad"
                          inputMode="numeric"
                          maxLength={6}
                          style={[styles.input, over ? styles.inputWarn : null]}
                          accessibilityLabel={`Cantidad a cargar para ${line.productName}`}
                        />
                      </View>
                    </View>
                    {over ? (
                      <Text style={styles.warn}>No puede superar lo asignado ({line.expectedQty}).</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
      {allPickupCounted ? (
        <View style={[styles.routeDock, { paddingBottom: dockBottomPad }]}>
          <SlideToStartAudit
            inDock
            hintText="Iniciar ruta"
            onSlideComplete={onStartRoute}
            busy={false}
          />
        </View>
      ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  shell: {
    flex: 1,
    position: "relative",
  },
  flex: {
    flex: 1,
  },
  routeDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "transparent",
    ...Platform.select({
      android: { elevation: 24 },
    }),
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  group: {
    marginBottom: 20,
  },
  groupHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  badge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EA7600",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeTxt: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },
  groupTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 20,
  },
  lineCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  prodName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 19,
  },
  folio: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  qtyRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
  },
  qtyCol: {
    flex: 1,
  },
  qtyColInput: {
    maxWidth: 120,
  },
  qtyLbl: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  qtyExpected: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  inputWarn: {
    borderColor: "#F97316",
    backgroundColor: "#FFF7ED",
  },
  warn: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#C2410C",
  },
  missing: {
    padding: 24,
  },
  missingTxt: {
    fontSize: 15,
    color: "#64748B",
  },
});
