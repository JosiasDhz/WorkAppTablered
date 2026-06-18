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
import { CloseCircle, Eye, EyeSlash } from "iconsax-react-native";

type DriverRouteWorkerCodeModalProps = {
  visible: boolean;
  busy: boolean;
  error: string | null;
  defaultWorkerCode?: string;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (workerCode: string) => void;
};

export function DriverRouteWorkerCodeModal({
  visible,
  busy,
  error,
  defaultWorkerCode = "",
  title = "Confirmar inicio",
  subtitle = "Ingresa tu código de trabajador para iniciar la ruta.",
  confirmLabel = "Iniciar ruta",
  onClose,
  onConfirm,
}: DriverRouteWorkerCodeModalProps) {
  const [workerCode, setWorkerCode] = useState("");
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (visible) {
      setWorkerCode(defaultWorkerCode.trim());
      setShowCode(false);
      return;
    }
    setWorkerCode("");
    setShowCode(false);
  }, [defaultWorkerCode, visible]);

  const trimmed = workerCode.trim();
  const canConfirm = trimmed.length > 0 && !busy;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <View style={styles.headText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
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

          <Text style={styles.label}>Código de trabajador</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={workerCode}
              onChangeText={setWorkerCode}
              placeholder="Ej. TR-1234"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              autoCorrect={false}
              secureTextEntry={!showCode}
              editable={!busy}
              style={styles.input}
              accessibilityLabel="Código de trabajador"
            />
            <Pressable
              onPress={() => setShowCode((v) => !v)}
              hitSlop={10}
              style={styles.eyeBtn}
              accessibilityLabel={showCode ? "Ocultar código" : "Mostrar código"}
            >
              {showCode ? (
                <EyeSlash size={20} color="#64748B" variant="Bold" />
              ) : (
                <Eye size={20} color="#64748B" variant="Bold" />
              )}
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.confirmBtn, !canConfirm ? styles.confirmBtnDisabled : null]}
            onPress={() => canConfirm && onConfirm(trimmed)}
            disabled={!canConfirm}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmTxt}>{confirmLabel}</Text>
            )}
          </Pressable>
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
    marginBottom: 18,
  },
  headText: {
    flex: 1,
    gap: 6,
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
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  eyeBtn: {
    padding: 4,
  },
  error: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#C2410C",
    lineHeight: 18,
  },
  confirmBtn: {
    marginTop: 18,
    height: 52,
    borderRadius: 999,
    backgroundColor: "#EA7600",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnDisabled: {
    opacity: 0.55,
  },
  confirmTxt: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
