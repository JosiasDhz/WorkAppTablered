import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ArrowDown2, ArrowRight2, Box1, TickCircle } from "iconsax-react-native";
import { SoftPressable } from "../../../components/SoftPressable";
import type { DriverRouteAssignmentDemoDestination } from "../driverDemo/driverRouteAssignmentDemo.types";
import { isDriverRouteTransferLine } from "../../../domain/driverRouteConfirmLines";
import { isDriverRouteStopDelivered } from "./deliveryStopProgress";
import { useDriverUi, type DriverUi } from "./driverUi";

function formatAddress(rec: DriverRouteAssignmentDemoDestination["records"][0]): string {
  return [
    rec.street,
    rec.externalNumber,
    rec.neighborhood,
    rec.city,
    rec.state,
    rec.zipCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatMetric(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function DriverRouteGlassDeliveryCard(props: {
  destination: DriverRouteAssignmentDemoDestination;
  displayNum: number;
  originLabel: string;
  routeInProcess: boolean;
  routeComplete?: boolean;
  productsCollapsed: boolean;
  onToggleProducts: () => void;
}) {
  const ui = useDriverUi();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const {
    destination,
    displayNum,
    originLabel,
    routeInProcess,
    routeComplete = false,
    productsCollapsed,
    onToggleProducts,
  } = props;
  const rec = destination.records[0];
  if (!rec) return null;

  const isSnapshot = destination.records.every(
    (row) => String(row.rowKind ?? "") === "route_stop_snapshot",
  );
  const isTransfer =
    !isSnapshot &&
    destination.records.some((row) =>
      isDriverRouteTransferLine({
        id: row.id,
        rowKind: row.rowKind,
        transferId: row.transferId,
        productName: row.productName,
        saleFolio: row.saleFolio,
        quantity: row.quantity,
        deliveryStatus: row.deliveryStatus,
      }),
    );
  const folio = isSnapshot
    ? "Devuelto a listo"
    : rec.saleFolio?.trim() || "—";
  const kindLabel = isSnapshot ? "Parada" : isTransfer ? "Traspaso" : "Venta";
  const addressLabel = rec.mapSearchQuery || formatAddress(rec);
  const showDelivered = isDriverRouteStopDelivered({
    rows: destination.records.map((row) => ({
      deliveryStatus: row.deliveryStatus,
      isTransfer: isDriverRouteTransferLine({
        id: row.id,
        rowKind: row.rowKind,
        transferId: row.transferId,
        productName: row.productName,
        saleFolio: row.saleFolio,
        quantity: row.quantity,
        deliveryStatus: row.deliveryStatus,
      }),
    })),
    routeInProcess,
    routeComplete,
  });
  const statusLabel = showDelivered ? "Entregado" : routeInProcess ? "En ruta" : null;
  const productCount = destination.records.length;
  const totalQty = destination.records.reduce((sum, row) => sum + (row.quantity || 0), 0);
  const totalVolumeM3 = destination.records.reduce(
    (sum, row) => sum + (parseFloat(row.volumeM3) || 0),
    0,
  );
  const totalWeightKg = destination.records.reduce(
    (sum, row) => sum + (parseFloat(row.weightKg) || 0),
    0,
  );
  const productNames = destination.records.map((row) => ({
    key: row.id,
    name: row.productName,
    qty: row.quantity,
  }));

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWell,
            { backgroundColor: showDelivered ? ui.greenSoft : ui.accentSoft },
          ]}
        >
          {showDelivered ? (
            <TickCircle size={20} color={ui.green} variant="Linear" />
          ) : (
            <Text style={styles.stopNum}>{displayNum}</Text>
          )}
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              Parada {displayNum}
            </Text>
            {statusLabel ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: showDelivered ? ui.greenSoft : ui.accentSoft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: showDelivered ? ui.green : ui.accent },
                  ]}
                >
                  {statusLabel}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {kindLabel} · {folio}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {addressLabel}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            Desde {originLabel}
          </Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <Text style={styles.metricTxt}>
          {productCount} · {totalQty} uds.
        </Text>
        <Text style={styles.metricDot}>·</Text>
        <Text style={styles.metricTxt}>{formatMetric(totalVolumeM3)} m³</Text>
        <Text style={styles.metricDot}>·</Text>
        <Text style={styles.metricTxt}>{formatMetric(totalWeightKg, 1)} kg</Text>
      </View>

      <SoftPressable
        onPress={onToggleProducts}
        scaleTo={0.98}
        accessibilityLabel={
          productsCollapsed ? "Ver productos" : "Ocultar productos"
        }
      >
        <View style={styles.productsToggle}>
          <Box1 size={16} color={ui.accent} variant="Linear" />
          <Text style={styles.productsToggleTxt}>
            {productsCollapsed ? "Ver productos" : "Ocultar productos"}
          </Text>
          {productsCollapsed ? (
            <ArrowRight2 size={16} color={ui.muted} variant="Linear" />
          ) : (
            <ArrowDown2 size={16} color={ui.muted} variant="Linear" />
          )}
        </View>
      </SoftPressable>

      {!productsCollapsed && productNames.length > 0 ? (
        <View style={styles.productsList}>
          {productNames.map((item) => (
            <View key={item.key} style={styles.productRow}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.productQty}>{item.qty}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(ui: DriverUi) {
  return StyleSheet.create({
    card: {
      backgroundColor: ui.surface,
      borderRadius: 16,
      padding: 14,
      gap: 10,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    iconWell: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    stopNum: {
      fontSize: 15,
      fontWeight: "700",
      color: ui.accent,
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      flex: 1,
      minWidth: 0,
      fontSize: 16,
      fontWeight: "600",
      color: ui.ink,
    },
    badge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "700",
    },
    meta: {
      marginTop: 3,
      fontSize: 13,
      fontWeight: "500",
      color: ui.muted,
    },
    desc: {
      marginTop: 6,
      fontSize: 13,
      fontWeight: "500",
      lineHeight: 18,
      color: ui.muted,
    },
    metrics: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
      paddingLeft: 50,
    },
    metricTxt: {
      fontSize: 13,
      fontWeight: "500",
      color: ui.muted,
    },
    metricDot: {
      fontSize: 13,
      color: ui.muted,
    },
    productsToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 40,
      paddingLeft: 50,
    },
    productsToggleTxt: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: ui.accent,
    },
    productsList: {
      gap: 8,
      paddingLeft: 50,
    },
    productRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
    },
    productName: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: ui.ink,
      lineHeight: 20,
    },
    productQty: {
      fontSize: 14,
      fontWeight: "700",
      color: ui.muted,
    },
  });
}
