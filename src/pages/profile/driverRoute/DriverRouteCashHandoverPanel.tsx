import React, { useMemo } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MoneyRecive } from "iconsax-react-native";
import { formatMoneyMxn } from "./deliveryLinesFromDestination";
import { useDriverUi, type DriverUi } from "./driverUi";

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
  const ui = useDriverUi();
  const styles = useMemo(() => createStyles(ui), [ui]);
  if (amountMxn <= 0 && !completed) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <View style={styles.iconWrap}>
          <MoneyRecive size={20} color={ui.amber} variant="Bold" />
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

function createStyles(ui: DriverUi) {
  return StyleSheet.create({
    card: {
      backgroundColor: ui.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: ui.amberBorder,
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
      backgroundColor: ui.amberSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    headCopy: {
      flex: 1,
    },
    title: {
      fontSize: 15,
      fontWeight: "800",
      color: ui.ink,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: "600",
      color: ui.muted,
      lineHeight: 18,
    },
    amountBox: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: ui.amberSoft,
      borderWidth: 1,
      borderColor: ui.amberBorder,
      marginBottom: 12,
    },
    amountLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: ui.amber,
      textTransform: "uppercase",
      letterSpacing: 0.35,
    },
    amountValue: {
      marginTop: 4,
      fontSize: 28,
      fontWeight: "900",
      color: ui.ink,
    },
    btn: {
      height: 52,
      borderRadius: 999,
      backgroundColor: ui.accent,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: ui.shadow,
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
}
