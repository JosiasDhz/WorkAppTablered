import React from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MoneyRecive } from "iconsax-react-native";
import { formatMoneyMxn } from "./deliveryLinesFromDestination";

type DriverRouteCashHandoverPanelProps = {
  amountMxn: number;
  busy: boolean;
  completed: boolean;
  onConfirm: () => void;
};

export function DriverRouteCashHandoverPanel({
  amountMxn,
  busy,
  completed,
  onConfirm,
}: DriverRouteCashHandoverPanelProps) {
  if (amountMxn <= 0 && !completed) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <View style={styles.iconWrap}>
          <MoneyRecive size={20} color="#B45309" variant="Bold" />
        </View>
        <View style={styles.headCopy}>
          <Text style={styles.title}>Entrega a caja</Text>
          <Text style={styles.subtitle}>
            {completed
              ? "El efectivo cobrado ya quedó registrado para caja."
              : "Entrega este monto en caja antes de finalizar la ruta."}
          </Text>
        </View>
      </View>

      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>
          {completed ? "Entregado a caja" : "Debes entregar"}
        </Text>
        <Text style={styles.amountValue}>{formatMoneyMxn(amountMxn)}</Text>
      </View>

      {!completed ? (
        <Pressable
          style={[styles.btn, busy ? styles.btnBusy : null]}
          onPress={onConfirm}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Confirmar entrega de efectivo a caja"
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.btnText}>Confirmar entrega a caja</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  headRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  headCopy: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    lineHeight: 18,
  },
  amountBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  amountValue: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  btn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: "#EA7600",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  btnBusy: {
    opacity: 0.85,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
