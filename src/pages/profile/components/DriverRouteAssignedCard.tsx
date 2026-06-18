import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight2,
  Box1,
  Clock,
  Location,
  Map1,
  Routing2,
  TickCircle,
  Truck,
} from "iconsax-react-native";
import type { DriverAssignedRouteRecord } from "../../../services/driverRoutesService";
import {
  buildDriverRouteListCardModel,
  getDriverRouteCardTone,
} from "../../../domain/driverRouteListCardModel";
import {
  DRIVER_ROUTE_SUMMARY_STRIP_TONES,
  TableRedColors,
  type DriverRouteSummaryStripKind,
} from "../../../theme/tableRedColors";

type Props = {
  item: DriverAssignedRouteRecord;
  onPress: () => void;
};

function SummaryStrip(props: {
  kind: DriverRouteSummaryStripKind;
  title: string;
  subtitle: string | null;
  count: number | null;
  countSuffix: string | null;
}) {
  const { kind, title, subtitle, count, countSuffix } = props;
  const tone = DRIVER_ROUTE_SUMMARY_STRIP_TONES[kind];
  const showCount = count != null && count > 0;

  const Icon =
    kind === "pending-driver"
      ? Box1
      : kind === "pending-warehouse"
        ? Clock
        : kind === "in-process"
          ? Truck
          : kind === "complete"
            ? TickCircle
            : kind === "ready"
              ? Location
              : Box1;

  return (
    <View
      style={[
        stripStyles.wrap,
        {
          backgroundColor: tone.containerBg,
          borderColor: tone.containerBorder,
        },
      ]}
    >
      <View style={[stripStyles.accent, { backgroundColor: tone.accent }]} />
      <View style={[stripStyles.iconWrap, { backgroundColor: tone.iconBg }]}>
        {tone.pulse ? <View style={stripStyles.pulse} /> : null}
        <Icon size={20} color={TableRedColors.white} variant="Bold" />
      </View>
      <View style={stripStyles.copy}>
        <Text style={[stripStyles.title, { color: tone.title }]}>{title}</Text>
        {subtitle ? (
          <Text style={[stripStyles.subtitle, { color: tone.subtitle }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showCount ? (
        <View style={[stripStyles.countBox, { backgroundColor: tone.countBg }]}>
          <Text style={[stripStyles.count, { color: tone.countText }]}>
            {count}
          </Text>
          {countSuffix ? (
            <Text style={[stripStyles.countSuffix, { color: tone.countSuffix }]}>
              {countSuffix.toUpperCase()}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function DriverRouteAssignedCard({ item, onPress }: Props) {
  const model = useMemo(() => buildDriverRouteListCardModel(item), [item]);
  const tone = getDriverRouteCardTone(model.toneKey);
  const vehicleLabel = model.vehiclesLine ?? "Sin vehículo asignado";
  const summaryCount =
    model.summaryUnits > 0 &&
    !model.isCompleta &&
    !model.isEnProceso &&
    !model.driverFullyConfirmed
      ? model.summaryUnits
      : null;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[styles.card, { borderColor: tone.border }]}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de ruta ${item.folio}`}
    >
      <LinearGradient
        colors={tone.header}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.header}
      >
        <View style={styles.headerIcon}>
          <Routing2 size={20} color={TableRedColors.white} variant="Bold" />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.folio}>{item.folio}</Text>
          <Text style={styles.warehouse} numberOfLines={1}>
            {item.originWarehouseName}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{model.operationalStatusLabel}</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.vehicleRow}>
          <Truck size={16} color={TableRedColors.gris} variant="Linear" />
          <Text style={styles.vehicleTxt} numberOfLines={2}>
            {vehicleLabel}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, styles.statDestinations]}>
            <Location size={16} color={TableRedColors.statVerdeText} variant="Linear" />
            <Text style={[styles.statNum, styles.statDestinationsTxt]}>
              {model.destinations}
            </Text>
            <Text style={[styles.statLbl, styles.statDestinationsTxt]}>
              DESTINO{model.destinations === 1 ? "" : "S"}
            </Text>
          </View>
          <View style={[styles.statBox, styles.statLines]}>
            <Box1 size={16} color={TableRedColors.statAzulText} variant="Linear" />
            <Text style={[styles.statNum, styles.statLinesTxt]}>{model.lines}</Text>
            <Text style={[styles.statLbl, styles.statLinesTxt]}>
              LÍNEA{model.lines === 1 ? "" : "S"}
            </Text>
          </View>
          <View style={[styles.statBox, styles.statUnits]}>
            <Box1 size={16} color={TableRedColors.statOcreText} variant="Linear" />
            <Text style={[styles.statNum, styles.statUnitsTxt]}>{model.units}</Text>
            <Text style={[styles.statLbl, styles.statUnitsTxt]}>UDS.</Text>
          </View>
        </View>

        <SummaryStrip
          kind={model.summaryStripKind}
          title={model.summaryTitle}
          subtitle={model.summarySubtitle}
          count={summaryCount}
          countSuffix={model.summaryCountSuffix}
        />

        <View style={[styles.cta, { backgroundColor: tone.button }]}>
          <Map1 size={16} color={TableRedColors.white} variant="Bold" />
          <Text style={styles.ctaTxt}>Ver ruta</Text>
          <ArrowRight2 size={16} color={TableRedColors.white} variant="Linear" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const stripStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 10,
    overflow: "hidden",
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  pulse: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TableRedColors.white,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  countBox: {
    minWidth: 72,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  count: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 26,
  },
  countSuffix: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 12,
  },
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: TableRedColors.crema,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: TableRedColors.marron,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  folio: {
    fontSize: 17,
    fontWeight: "800",
    color: TableRedColors.white,
    letterSpacing: -0.2,
  },
  warehouse: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  badge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 120,
  },
  badgeTxt: {
    fontSize: 11,
    fontWeight: "700",
    color: TableRedColors.white,
    textAlign: "center",
  },
  body: {
    padding: 16,
    gap: 14,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  vehicleTxt: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(78, 66, 58, 0.82)",
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 4,
  },
  statDestinations: {
    backgroundColor: "rgba(107, 133, 112, 0.12)",
    borderColor: "rgba(107, 133, 112, 0.35)",
  },
  statLines: {
    backgroundColor: "rgba(78, 109, 130, 0.1)",
    borderColor: "rgba(78, 109, 130, 0.35)",
  },
  statUnits: {
    backgroundColor: "rgba(204, 153, 0, 0.12)",
    borderColor: "rgba(204, 153, 0, 0.4)",
  },
  statNum: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 20,
  },
  statLbl: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  statDestinationsTxt: {
    color: TableRedColors.statVerdeText,
  },
  statLinesTxt: {
    color: TableRedColors.statAzulText,
  },
  statUnitsTxt: {
    color: TableRedColors.statOcreText,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  ctaTxt: {
    fontSize: 14,
    fontWeight: "800",
    color: TableRedColors.white,
  },
});
