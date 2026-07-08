import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Car, Location, Routing2, User } from "iconsax-react-native";
import { TableRedColors } from "../../../theme/tableRedColors";

const C = TableRedColors;

export function DriverRouteMapMetaCard(props: {
  originLabel: string;
  vehicleLabel?: string | null;
  vehicleColor?: string;
  driverLabel?: string | null;
}) {
  const { originLabel, vehicleLabel, vehicleColor, driverLabel } = props;
  const metaItems: Array<{ key: string; icon: React.ReactElement; label: string }> = [];
  if (originLabel) {
    metaItems.push({
      key: "origin",
      icon: <Location size={10} color={C.azul} variant="Bold" />,
      label: originLabel,
    });
  }
  if (vehicleLabel) {
    metaItems.push({
      key: "vehicle",
      icon: <Car size={10} color={vehicleColor ?? C.verdeHover} variant="Bold" />,
      label: vehicleLabel,
    });
  }
  if (driverLabel) {
    metaItems.push({
      key: "driver",
      icon: <User size={10} color="#7C3AED" variant="Bold" />,
      label: driverLabel,
    });
  }

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Routing2 size={12} color="#FFFFFF" variant="Bold" />
        </View>
        <Text style={styles.brandLabel}>Tu ruta</Text>
      </View>
      <View style={styles.metaRow}>
        {metaItems.map((item, index) => (
          <React.Fragment key={item.key}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>{item.icon}</View>
              <Text style={styles.metaLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 32,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(148, 163, 184, 0.45)",
  },
  brandIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  brandLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0F172A",
  },
  metaRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  metaIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  metaLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: "500",
    color: "#334155",
  },
  divider: {
    width: 1,
    height: 12,
    marginHorizontal: 4,
    backgroundColor: "rgba(148, 163, 184, 0.45)",
  },
});
