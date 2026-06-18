import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { DriverRouteAssignmentDemoDestination } from "../driverDemo/driverRouteAssignmentDemo.types";

export type DriverRouteStopsListProps = {
  originName: string;
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

function TimelineNode({
  dotColor,
  showLine,
  label,
  title,
  subtitle,
  children,
}: {
  dotColor: string;
  showLine: boolean;
  label: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.nodeRow}>
      <View style={styles.railCol}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        {showLine ? <View style={styles.railLine} /> : null}
      </View>
      <View style={[styles.nodeBody, !showLine && styles.nodeBodyLast]}>
        <Text style={styles.nodeLabel}>{label}</Text>
        <Text style={styles.nodeTitle}>{title}</Text>
        {subtitle ? <Text style={styles.nodeSubtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </View>
  );
}

export function DriverRouteStopsList({ originName, destinations }: DriverRouteStopsListProps) {
  const totalNodes = destinations.length + 1;

  return (
    <View style={styles.wrap}>
      <TimelineNode
        dotColor="#696158"
        showLine={destinations.length > 0}
        label="Origen"
        title={originName}
        subtitle="Punto de salida del almacén"
      />

      {destinations.map((dest, index) => {
        const rec = dest.records[0];
        if (!rec) return null;
        const units = dest.records.reduce((sum, row) => sum + (row.quantity || 0), 0);
        const title = rec.mapSearchQuery || formatAddress(rec);
        const isLast = index === destinations.length - 1;

        return (
          <TimelineNode
            key={dest.id}
            dotColor={dest.pinColorHex || "#EA7600"}
            showLine={!isLast}
            label={`Parada ${dest.visitOrder}`}
            title={title}
            subtitle={`${units} uds. · ${dest.records.length} ${dest.records.length === 1 ? "entrega" : "entregas"}`}
          >
            <Text style={styles.addrTxt}>{formatAddress(rec)}</Text>
            {dest.records.map((r) => (
              <View key={r.id} style={styles.prodRow}>
                <Text style={styles.prodName} numberOfLines={2}>
                  {r.productName}
                </Text>
                <Text style={styles.prodMeta}>
                  {r.saleFolio} · {r.quantity} uds.
                </Text>
              </View>
            ))}
          </TimelineNode>
        );
      })}

      {totalNodes <= 1 ? (
        <Text style={styles.emptyStops}>Sin paradas asignadas en esta ruta.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 4,
  },
  nodeRow: {
    flexDirection: "row",
    gap: 12,
  },
  railCol: {
    width: 22,
    alignItems: "center",
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  railLine: {
    flex: 1,
    width: 2,
    minHeight: 24,
    marginVertical: 4,
    borderRadius: 1,
    backgroundColor: "#CBD5E1",
  },
  nodeBody: {
    flex: 1,
    paddingBottom: 20,
  },
  nodeBodyLast: {
    paddingBottom: 4,
  },
  nodeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  nodeTitle: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 21,
  },
  nodeSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  addrTxt: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
    lineHeight: 18,
  },
  prodRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EEF2F6",
  },
  prodName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    lineHeight: 18,
  },
  prodMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  emptyStops: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },
});
