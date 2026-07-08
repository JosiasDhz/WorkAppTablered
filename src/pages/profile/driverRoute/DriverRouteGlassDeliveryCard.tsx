import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ArrowDown2, ArrowRight2, Box1, TickCircle } from "iconsax-react-native";
import type { DriverRouteAssignmentDemoDestination } from "../driverDemo/driverRouteAssignmentDemo.types";
import { isDriverRouteTransferLine } from "../../../domain/driverRouteConfirmLines";
import {
  isDriverRouteStopDelivered,
} from "./deliveryStopProgress";
import { driverRouteGlassCardStyle, rgba } from "./driverRouteGlass";
import { TableRedColors } from "../../../theme/tableRedColors";

const C = TableRedColors;

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
  const { destination, displayNum, originLabel, routeInProcess, routeComplete = false, productsCollapsed, onToggleProducts } =
    props;
  const rec = destination.records[0];
  if (!rec) return null;

  const isTransfer = destination.records.some((row) =>
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
  const color = destination.pinColorHex || C.naranja;
  const folio = rec.saleFolio?.trim() || "—";
  const kindLabel = isTransfer ? "Traspaso" : "Venta";
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
    <View style={driverRouteGlassCardStyle(color, false)}>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.folio} numberOfLines={1}>
              {kindLabel} · {folio}
            </Text>
            <Text style={styles.parada}>Parada {displayNum}</Text>
          </View>
          {statusLabel ? (
            <View
              style={[
                styles.statusPill,
                showDelivered ? styles.statusDelivered : styles.statusEnRuta,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: showDelivered ? "#10B981" : "#8B5CF6" },
                ]}
              />
              <Text
                style={[
                  styles.statusTxt,
                  showDelivered ? styles.statusTxtDelivered : styles.statusTxtEnRuta,
                ]}
              >
                {statusLabel}
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.stopNum,
                { borderColor: color, backgroundColor: rgba(color, 0.08) },
              ]}
            >
              <Text style={[styles.stopNumTxt, { color }]}>{displayNum}</Text>
            </View>
          )}
        </View>

        <View style={styles.routeRow}>
          <View style={styles.routeRail}>
            <View style={styles.routeDotOpen} />
            <View style={styles.routeLine} />
            <View style={styles.routeDotSolid} />
          </View>
          <View style={styles.routeCopy}>
            <View>
              <Text style={styles.routeKicker}>Desde</Text>
              <Text style={styles.routeValue} numberOfLines={2}>
                {originLabel}
              </Text>
            </View>
            <View style={styles.routeDest}>
              <Text style={styles.routeKicker}>Entrega</Text>
              <Text style={styles.routeValue} numberOfLines={2}>
                {addressLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metrics}>
          <View style={styles.metricChip}>
            <Box1 size={12} color="#334155" variant="Bold" />
            <Text style={styles.metricTxt}>
              {productCount} · {totalQty} uds.
            </Text>
          </View>
          <View style={styles.metricChip}>
            <Text style={styles.metricTxt}>{formatMetric(totalVolumeM3)} m³</Text>
          </View>
          <View style={styles.metricChip}>
            <Text style={styles.metricTxt}>{formatMetric(totalWeightKg, 1)} kg</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.productsToggle}
          onPress={onToggleProducts}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          {productsCollapsed ? (
            <ArrowRight2 size={14} color="#475569" />
          ) : (
            <ArrowDown2 size={14} color="#475569" />
          )}
          <Text style={styles.productsToggleTxt}>
            {productsCollapsed ? "Ver productos" : "Ocultar productos"}
          </Text>
        </TouchableOpacity>

        {!productsCollapsed && productNames.length > 0 ? (
          <View style={styles.productsList}>
            {productNames.map((p) => (
              <View key={p.key} style={styles.productRow}>
                <Text style={styles.productName} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={styles.productQty}>{p.qty}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {showDelivered ? (
          <View style={styles.deliveredBtn}>
            <TickCircle size={14} color="#047857" variant="Bold" />
            <Text style={styles.deliveredBtnTxt}>Entregado</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  folio: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F172A",
  },
  parada: {
    marginTop: 2,
    fontSize: 10,
    color: "#64748B",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusDelivered: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  statusEnRuta: {
    backgroundColor: "#F5F3FF",
    borderColor: "#DDD6FE",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTxt: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusTxtDelivered: {
    color: "#065F46",
  },
  statusTxtEnRuta: {
    color: "#5B21B6",
  },
  stopNum: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  stopNumTxt: {
    fontSize: 10,
    fontWeight: "800",
  },
  routeRow: {
    flexDirection: "row",
    gap: 8,
  },
  routeRail: {
    width: 12,
    alignItems: "center",
    paddingTop: 2,
  },
  routeDotOpen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  routeLine: {
    flex: 1,
    width: 1,
    minHeight: 12,
    marginVertical: 2,
    borderLeftWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
  },
  routeDotSolid: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0F172A",
  },
  routeCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  routeDest: {
    marginTop: 4,
  },
  routeKicker: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "#64748B",
  },
  routeValue: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 15,
  },
  metrics: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metricChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  metricTxt: {
    fontSize: 10,
    fontWeight: "700",
    color: "#334155",
  },
  productsToggle: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  productsToggleTxt: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  productsList: {
    marginTop: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    backgroundColor: "rgba(248, 250, 252, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  productName: {
    flex: 1,
    fontSize: 10,
    color: "#1E293B",
    lineHeight: 14,
  },
  productQty: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
  },
  deliveredBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
    paddingVertical: 8,
  },
  deliveredBtnTxt: {
    fontSize: 11,
    fontWeight: "800",
    color: "#047857",
  },
});
