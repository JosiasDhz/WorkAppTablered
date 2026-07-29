import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Warning2 } from "iconsax-react-native";
import type { DriverIncidentReason } from "../../types/driverIncidents";

export type LineIncidentDraft = {
  reason: DriverIncidentReason;
  receivedQuantity: number;
  damagedQuantity: number;
  comment: string;
};

type Props = {
  visible: boolean;
  productName: string;
  expectedQuantity: number;
  initial?: LineIncidentDraft | null;
  onClose: () => void;
  onSave: (draft: LineIncidentDraft) => void;
  onClear?: () => void;
};

const REASONS: Array<{
  value: DriverIncidentReason;
  label: string;
  hint: string;
}> = [
  {
    value: "faltante_recepcion",
    label: "Faltante",
    hint: "Indica cuántas piezas no te entregaron",
  },
  {
    value: "danado_recepcion",
    label: "Dañado",
    hint: "Indica cuántas piezas vinieron dañadas",
  },
];

function parseQty(raw: string, fallback = 0): number {
  const n = Number.parseInt(raw.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
}

export function DriverRouteLineIncidentModal({
  visible,
  productName,
  expectedQuantity,
  initial,
  onClose,
  onSave,
  onClear,
}: Props) {
  const [reason, setReason] = useState<DriverIncidentReason>(
    initial?.reason ?? "danado_recepcion",
  );
  const [affectedRaw, setAffectedRaw] = useState("");
  const [comment, setComment] = useState(initial?.comment ?? "");

  useEffect(() => {
    if (!visible) return;
    const nextReason = initial?.reason ?? "danado_recepcion";
    setReason(nextReason);
    setComment(initial?.comment ?? "");
    if (!initial) {
      setAffectedRaw("");
      return;
    }
    if (nextReason === "danado_recepcion") {
      setAffectedRaw(
        initial.damagedQuantity > 0 ? String(initial.damagedQuantity) : "",
      );
      return;
    }
    const missing = Math.max(0, expectedQuantity - initial.receivedQuantity);
    setAffectedRaw(missing > 0 ? String(missing) : "");
  }, [visible, initial, expectedQuantity]);

  const affected = parseQty(affectedRaw, 0);
  const hasAffected = /\d/.test(affectedRaw.trim());

  const summary = useMemo(() => {
    if (!hasAffected) return null;
    if (reason === "danado_recepcion") {
      return `${affected} de ${expectedQuantity} dañadas`;
    }
    return `${affected} de ${expectedQuantity} faltantes`;
  }, [affected, expectedQuantity, hasAffected, reason]);

  const validationError = useMemo(() => {
    if (!hasAffected) {
      return reason === "danado_recepcion"
        ? "Indica cuántas vinieron dañadas."
        : "Indica cuántas piezas faltan.";
    }
    if (affected <= 0) {
      return "La cantidad debe ser mayor a 0.";
    }
    if (affected > expectedQuantity) {
      return `No puede superar lo asignado (${expectedQuantity}).`;
    }
    return null;
  }, [affected, expectedQuantity, hasAffected, reason]);

  const canSave = !validationError;

  const handleSave = () => {
    if (!canSave) return;
    if (reason === "danado_recepcion") {
      onSave({
        reason,
        receivedQuantity: expectedQuantity,
        damagedQuantity: affected,
        comment: comment.trim(),
      });
      return;
    }
    onSave({
      reason,
      receivedQuantity: Math.max(0, expectedQuantity - affected),
      damagedQuantity: 0,
      comment: comment.trim(),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Warning2 size={22} color="#C2410C" variant="Bold" />
            <Text style={styles.title}>Reportar incidencia</Text>
          </View>
          <Text style={styles.product} numberOfLines={3}>
            {productName}
          </Text>
          <Text style={styles.meta}>Asignadas en ruta: {expectedQuantity}</Text>

          <Text style={styles.label}>Motivo</Text>
          <View style={styles.reasonRow}>
            {REASONS.map((item) => {
              const active = reason === item.value;
              return (
                <Pressable
                  key={item.value}
                  style={[styles.reasonChip, active ? styles.reasonChipOn : null]}
                  onPress={() => {
                    setReason(item.value);
                    setAffectedRaw("");
                  }}
                >
                  <Text style={[styles.reasonTxt, active ? styles.reasonTxtOn : null]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>
            {REASONS.find((r) => r.value === reason)?.hint}
          </Text>

          <Text style={styles.label}>
            {reason === "danado_recepcion"
              ? "¿Cuántas vinieron dañadas?"
              : "¿Cuántas te faltaron?"}
          </Text>
          <TextInput
            value={affectedRaw}
            onChangeText={setAffectedRaw}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={6}
            placeholder="0"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          {summary ? (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryMain}>{summary}</Text>
              <Text style={styles.summarySub}>
                del total asignado en la ruta ({expectedQuantity})
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>Comentario (opcional)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Ej. llegó abierto / faltó en el traspaso"
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.comment]}
            multiline
          />

          {validationError ? <Text style={styles.error}>{validationError}</Text> : null}

          <View style={styles.actions}>
            {initial && onClear ? (
              <Pressable style={styles.secondaryBtn} onPress={onClear}>
                <Text style={styles.secondaryTxt}>Quitar incidencia</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.secondaryBtn} onPress={onClose}>
                <Text style={styles.secondaryTxt}>Cancelar</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.primaryBtn, !canSave ? styles.primaryDisabled : null]}
              disabled={!canSave}
              onPress={handleSave}
            >
              <Text style={styles.primaryTxt}>Guardar incidencia</Text>
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
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  product: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    lineHeight: 19,
  },
  meta: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#64748B" },
  label: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  reasonRow: { flexDirection: "row", gap: 8 },
  reasonChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  reasonChipOn: {
    borderColor: "#EA7600",
    backgroundColor: "#FFF7ED",
  },
  reasonTxt: { fontSize: 14, fontWeight: "800", color: "#64748B" },
  reasonTxtOn: { color: "#C2410C" },
  hint: { marginTop: 8, fontSize: 12, fontWeight: "600", color: "#94A3B8" },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  summaryBox: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  summaryMain: {
    fontSize: 20,
    fontWeight: "800",
    color: "#C2410C",
  },
  summarySub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#9A3412",
  },
  comment: { fontSize: 14, fontWeight: "600", minHeight: 64, textAlignVertical: "top" },
  error: { marginTop: 10, fontSize: 12, fontWeight: "700", color: "#DC2626" },
  actions: { marginTop: 18, flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  secondaryTxt: { fontSize: 14, fontWeight: "800", color: "#475569" },
  primaryBtn: {
    flex: 1.2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#EA7600",
  },
  primaryDisabled: { opacity: 0.5 },
  primaryTxt: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
});
