import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Location, Map1 } from "iconsax-react-native";
import type { DriverRouteAssignmentDemoDestination } from "../driverDemo/driverRouteAssignmentDemo.types";
import { TableRedColors } from "../../../theme/tableRedColors";

const C = TableRedColors;

export type DriverRouteDetailTripRowsProps = {
  originName: string;
  destinations: DriverRouteAssignmentDemoDestination[];
  embedded?: boolean;
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

function TripRow(props: {
  kind: "origin" | "stop";
  label: string;
  title: string;
  meta?: string;
  showDivider: boolean;
}) {
  const { kind, label, title, meta, showDivider } = props;
  const Icon = kind === "origin" ? Location : Map1;
  const iconColor = kind === "origin" ? C.corteza : C.naranja;

  return (
    <View style={[styles.row, showDivider ? styles.rowDivider : null]}>
      <View style={[styles.iconWrap, kind === "origin" ? styles.iconOrigin : styles.iconStop]}>
        <Icon size={18} color={iconColor} variant="Bold" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </View>
  );
}

export function DriverRouteDetailTripRows({
  originName,
  destinations,
  embedded = false,
}: DriverRouteDetailTripRowsProps) {
  const rows: React.ReactNode[] = [
    <TripRow
      key="origin"
      kind="origin"
      label="Origen"
      title={originName}
      meta="Salida del almacén"
      showDivider={destinations.length > 0}
    />,
  ];

  destinations.forEach((dest, index) => {
    const rec = dest.records[0];
    if (!rec) return;
    const units = dest.records.reduce((sum, row) => sum + (row.quantity || 0), 0);
    const title = rec.mapSearchQuery || formatAddress(rec);
    const meta = `${units} uds. · ${dest.records.length} ${
      dest.records.length === 1 ? "entrega" : "entregas"
    }`;

    rows.push(
      <TripRow
        key={dest.id}
        kind="stop"
        label={`Parada ${index + 1} (${dest.visitOrder})`}
        title={title}
        meta={meta}
        showDivider={index < destinations.length - 1}
      />,
    );
  });

  if (rows.length <= 1 && destinations.length === 0) {
    const empty = (
      <Text style={styles.empty}>Sin paradas asignadas en esta ruta.</Text>
    );
    return embedded ? <View style={styles.embedded}>{empty}</View> : (
      <View style={styles.card}>{empty}</View>
    );
  }

  return embedded ? (
    <View style={styles.embedded}>{rows}</View>
  ) : (
    <View style={styles.card}>{rows}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.line,
    overflow: "hidden",
    paddingHorizontal: 20,
    shadowColor: C.marron,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  embedded: {
    marginTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconOrigin: {
    backgroundColor: "rgba(105, 97, 88, 0.12)",
  },
  iconStop: {
    backgroundColor: "rgba(234, 118, 0, 0.12)",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: C.gris,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: "700",
    color: C.ink,
    lineHeight: 20,
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: C.gris,
  },
  empty: {
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: "500",
    color: C.gris,
    textAlign: "center",
  },
});
