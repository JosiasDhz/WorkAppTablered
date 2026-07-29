import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { HeaderTitle } from "../../components/HeaderTitle";
import type { RootStackParamList } from "../../routes/RootStackParamList";
import { DriverRouteWorkerCodeModal } from "./driverRoute/DriverRouteWorkerCodeModal";
import { useSessionWorkerCode } from "../../hooks/useSessionWorkerCode";
import {
  createDriverIncident,
} from "../../services/driverIncidentsService";

function extractApiErrorMessage(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const resp = (e as { response?: { data?: { message?: unknown } } }).response;
    const msg = resp?.data?.message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg.map(String).join(", ");
  }
  return "No se pudo registrar la incidencia";
}

export default function DriverRouteReportIncidentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { params } =
    useRoute<RouteProp<RootStackParamList, "DriverRouteReportIncident">>();
  const routeId = params?.routeId ?? "";
  const sessionWorkerCode = useSessionWorkerCode();

  const [productName, setProductName] = useState("");
  const [expectedQuantity, setExpectedQuantity] = useState("1");
  const [damagedQuantity, setDamagedQuantity] = useState("1");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workerCodeModalOpen, setWorkerCodeModalOpen] = useState(false);

  const submit = useCallback(
    async (workerCode: string) => {
      if (!productName.trim()) {
        setError("Indica el producto afectado");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await createDriverIncident({
          deliveryRouteId: routeId,
          reason: "danado_transito",
          phase: "en_ruta",
          productName: productName.trim(),
          expectedQuantity: Math.max(1, Number.parseInt(expectedQuantity, 10) || 1),
          receivedQuantity: 0,
          damagedQuantity: Math.max(1, Number.parseInt(damagedQuantity, 10) || 1),
          comment: comment.trim() || undefined,
          workerCode,
        });
        Toast.show({
          type: "success",
          text1: "Incidencia registrada",
          text2: "El almacén y directivos fueron notificados.",
        });
        navigation.goBack();
      } catch (e: unknown) {
        setError(extractApiErrorMessage(e));
        setWorkerCodeModalOpen(true);
      } finally {
        setBusy(false);
      }
    },
    [comment, damagedQuantity, expectedQuantity, navigation, productName, routeId],
  );

  const openSubmit = useCallback(() => {
    if (sessionWorkerCode) {
      void submit(sessionWorkerCode);
      return;
    }
    setWorkerCodeModalOpen(true);
  }, [sessionWorkerCode, submit]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <HeaderTitle
        title="Reportar daño en ruta"
        subtitle="Se creará una incidencia para revisión"
        tone="light"
      />
      <ScrollView contentContainerStyle={[styles.pad, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.label}>Producto</Text>
        <TextInput
          value={productName}
          onChangeText={setProductName}
          placeholder="Nombre del producto"
          style={styles.input}
        />
        <Text style={styles.label}>Cantidad esperada</Text>
        <TextInput
          value={expectedQuantity}
          onChangeText={setExpectedQuantity}
          keyboardType="number-pad"
          style={styles.input}
        />
        <Text style={styles.label}>Cantidad dañada</Text>
        <TextInput
          value={damagedQuantity}
          onChangeText={setDamagedQuantity}
          keyboardType="number-pad"
          style={styles.input}
        />
        <Text style={styles.label}>Comentario</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          multiline
          style={[styles.input, { minHeight: 88 }]}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.btn} onPress={openSubmit} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnTxt}>Registrar incidencia</Text>
          )}
        </Pressable>
      </ScrollView>
      <DriverRouteWorkerCodeModal
        visible={workerCodeModalOpen}
        busy={busy}
        error={error}
        defaultWorkerCode={sessionWorkerCode}
        title="Reportar incidencia"
        subtitle="Confirma con tu código de trabajador."
        confirmLabel="Registrar"
        onClose={() => {
          if (!busy) {
            setWorkerCodeModalOpen(false);
            setError(null);
          }
        }}
        onConfirm={submit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1F5F9" },
  pad: { padding: 16, gap: 8 },
  label: { fontSize: 13, fontWeight: "700", color: "#475569", marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0F172A",
  },
  error: { color: "#DC2626", fontSize: 13, marginTop: 8 },
  btn: {
    marginTop: 16,
    backgroundColor: "#EA7600",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
