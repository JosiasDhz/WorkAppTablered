import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CloseCircle, Warning2 } from "iconsax-react-native";

type DriverRouteReturnToReadyModalProps = {
  visible: boolean;
  busy: boolean;
  error?: string | null;
  addressLine?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export function DriverRouteReturnToReadyModal({
  visible,
  busy,
  error,
  addressLine,
  onClose,
  onConfirm,
}: DriverRouteReturnToReadyModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!visible) {
      setReason("");
    }
  }, [visible]);

  const trimmed = reason.trim();
  const canConfirm = trimmed.length >= 5 && !busy;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <View style={styles.headText}>
              <View style={styles.titleRow}>
                <Warning2 size={22} color="#C2410C" variant="Bold" />
                <Text style={styles.title}>No pude entregar</Text>
              </View>
              <Text style={styles.subtitle}>
                Esta parada saldrá de tu ruta y el envío quedará listo para
                reasignar. Indica el motivo.
              </Text>
              {addressLine ? (
                <Text style={styles.addr} numberOfLines={2}>
                  {addressLine}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              disabled={busy}
              hitSlop={10}
              accessibilityLabel="Cerrar"
            >
              <CloseCircle size={26} color="#64748B" variant="Bold" />
            </Pressable>
          </View>

          <Text style={styles.label}>Motivo</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Ej. cliente no estaba / reprogramar para mañana"
            placeholderTextColor="#94A3B8"
            editable={!busy}
            multiline
            maxLength={500}
            style={styles.input}
            accessibilityLabel="Motivo de no entrega"
          />
          <Text style={styles.hint}>Mínimo 5 caracteres</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={onClose}
              disabled={busy}
            >
              <Text style={styles.secondaryTxt}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, !canConfirm ? styles.primaryDisabled : null]}
              onPress={() => canConfirm && onConfirm(trimmed)}
              disabled={!canConfirm}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryTxt}>Quitar de la ruta</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  headText: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    lineHeight: 20,
  },
  addr: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    lineHeight: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    textAlignVertical: "top",
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  error: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#C2410C",
    lineHeight: 18,
  },
  actions: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  secondaryTxt: {
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
  },
  primaryBtn: {
    flex: 1.2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C2410C",
    minHeight: 48,
  },
  primaryDisabled: {
    opacity: 0.5,
  },
  primaryTxt: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
