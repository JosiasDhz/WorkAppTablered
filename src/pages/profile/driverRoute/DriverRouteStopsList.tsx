import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Location } from "iconsax-react-native";
import type { DriverRouteAssignmentDemoDestination } from "../driverDemo/driverRouteAssignmentDemo.types";

export type DriverRouteStopsListProps = {
  destinations: DriverRouteAssignmentDemoDestination[];
};

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

export function DriverRouteStopsList({ destinations }: DriverRouteStopsListProps) {
  return (
    <View style={styles.wrap}>
      {destinations.map((dest) => {
        const rec = dest.records[0];
        if (!rec) return null;
        return (
          <View
            key={dest.id}
            style={[styles.card, { borderLeftColor: dest.pinColorHex || "#EA7600" }]}
          >
            <View style={styles.cardHead}>
              <View style={[styles.orderBadge, { backgroundColor: dest.pinColorHex || "#EA7600" }]}>
                <Text style={styles.orderTxt}>{dest.visitOrder}</Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {rec.mapSearchQuery || formatAddress(rec)}
              </Text>
            </View>
            <View style={styles.addrRow}>
              <Location size={16} color="#64748B" variant="Linear" />
              <Text style={styles.addrTxt}>{formatAddress(rec)}</Text>
            </View>
            {dest.records.map((r) => (
              <View key={r.id} style={styles.lineRow}>
                <Text style={styles.prodName} numberOfLines={3}>
                  {r.productName}
                </Text>
                <Text style={styles.prodMeta}>
                  {r.saleFolio} · {r.quantity} uds.
                </Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 5,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  orderBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  orderTxt: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 19,
  },
  addrRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  addrTxt: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
    lineHeight: 18,
  },
  lineRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  prodName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  prodMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
});
