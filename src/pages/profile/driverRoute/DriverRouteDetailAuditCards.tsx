import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type ImageResizeMode,
} from "react-native";
import { GasStation, Speedometer, TickCircle } from "iconsax-react-native";
import { TapImagePreview } from "../../../components/TapImagePreview";
import { useTableredFileImageHeaders } from "../../../hooks/useTableredFileImageHeaders";
import type { DriverRouteAssignmentDemo } from "../driverDemo/driverRouteAssignmentDemo.types";
import { destinationsInRouteTravelOrder } from "./driverRouteDestinationsTravelOrder";
import { driverRouteFileViewUrl, resolveDriverRouteSignatureUri } from "./driverRouteFileViewUrl";
import { TableRedColors } from "../../../theme/tableRedColors";

const C = TableRedColors;

type DriverRouteDetailAuditCardsProps = {
  detail: DriverRouteAssignmentDemo;
  embedded?: boolean;
};

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function isDeliveredStatus(status: string): boolean {
  const s = status.trim().toUpperCase();
  return s === "ENTREGADO" || s === "ENTREGADO_CHOFER";
}

function AuditCard(props: {
  title: string;
  children: React.ReactNode;
  delayMs: number;
  embedded?: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          friction: 8,
          tension: 72,
          useNativeDriver: true,
        }),
      ]).start();
    }, props.delayMs);
    return () => clearTimeout(timer);
  }, [opacity, props.delayMs, slide]);

  return (
    <Animated.View
      style={[
        props.embedded ? styles.section : styles.card,
        { opacity, transform: [{ translateY: slide }] },
      ]}
    >
      <Text style={styles.cardTitle}>{props.title}</Text>
      {props.children}
    </Animated.View>
  );
}

function AuditImagePreview(props: {
  uri: string;
  label: string;
  imageStyle: object;
  wrapStyle?: object;
  resizeMode?: ImageResizeMode;
}) {
  const headers = useTableredFileImageHeaders(props.uri);
  const source = useMemo((): ImageSourcePropType => {
    return headers
      ? { uri: props.uri, headers }
      : { uri: props.uri };
  }, [headers, props.uri]);

  return (
    <View style={props.wrapStyle}>
      <TapImagePreview uri={props.uri} headers={headers}>
        <Image
          source={source}
          style={props.imageStyle}
          resizeMode={props.resizeMode ?? "cover"}
          accessibilityLabel={props.label}
        />
      </TapImagePreview>
      <Text style={styles.thumbLabel} numberOfLines={1}>
        {props.label}
      </Text>
    </View>
  );
}

function EvidenceThumb({ fileId, label }: { fileId: string; label: string }) {
  const uri = driverRouteFileViewUrl(fileId);
  if (!uri) return null;
  return (
    <AuditImagePreview
      uri={uri}
      label={label}
      wrapStyle={styles.thumbWrap}
      imageStyle={styles.thumb}
    />
  );
}

function SignaturePreview({ signature, label }: { signature: string; label: string }) {
  const uri = resolveDriverRouteSignatureUri(signature);
  if (!uri) return null;
  return (
    <AuditImagePreview
      uri={uri}
      label={label}
      wrapStyle={styles.signaturePreviewWrap}
      imageStyle={styles.signatureImg}
      resizeMode="contain"
    />
  );
}

function MetricRow(props: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{props.label}</Text>
      <Text style={styles.metricValue}>{props.value}</Text>
    </View>
  );
}

export function DriverRouteDetailAuditCards({
  detail,
  embedded = false,
}: DriverRouteDetailAuditCardsProps) {
  const { route } = detail;
  const ordered = useMemo(() => destinationsInRouteTravelOrder(detail), [detail]);

  const deliveredStops = useMemo(
    () =>
      ordered.filter((dest) =>
        dest.records.some((rec) => isDeliveredStatus(String(rec.deliveryStatus ?? ""))),
      ),
    [ordered],
  );

  const hasStartAudit =
    route.routeStartOdometerReading != null ||
    Boolean(route.routeStartOdometerEvidenceFileId);
  const hasEndAudit =
    route.routeEndOdometerReading != null ||
    Boolean(route.routeEndOdometerEvidenceFileId) ||
    Boolean(route.routeEndFuelEvidenceFileId);

  const deliveryEvidenceStops = useMemo(() => {
    return ordered
      .map((dest, index) => {
        const rec = dest.records[0];
        if (!rec) return null;
        const evidenceIds = [
          ...new Set(
            dest.records.flatMap((row) => row.deliveryEvidenceFileIds ?? []),
          ),
        ];
        const signature =
          dest.records
            .map((row) => row.deliverySignatureDataUrl)
            .find((value) => Boolean(String(value ?? "").trim())) ?? null;
        const deliveredAt =
          dest.records
            .map((row) => row.driverDeliveredAtCdmx ?? row.deliveryCompletionAtCdmx)
            .find((value) => Boolean(String(value ?? "").trim())) ?? null;
        const delivered = isDeliveredStatus(String(rec.deliveryStatus ?? ""));
        const deliveredUnits = dest.records.reduce(
          (sum, row) => sum + (Number(row.quantity) || 0),
          0,
        );
        if (!delivered && evidenceIds.length === 0 && !signature) {
          return null;
        }
        const address =
          [rec.street, rec.externalNumber, rec.neighborhood, rec.city]
            .filter(Boolean)
            .join(", ") || rec.mapSearchQuery;
        return {
          key: dest.id,
          title: `Parada ${index + 1}`,
          address,
          deliveredAt,
          deliveredUnits,
          delivered,
          evidenceIds,
          signature,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item != null);
  }, [ordered]);

  if (!hasStartAudit && !hasEndAudit && deliveryEvidenceStops.length === 0) {
    return null;
  }

  let delay = 0;
  const nextDelay = () => {
    const current = delay;
    delay += 120;
    return current;
  };

  return (
    <View style={embedded ? styles.embeddedWrap : styles.wrap}>
      {hasStartAudit ? (
        <AuditCard title="Salida de ruta" delayMs={nextDelay()} embedded={embedded}>
          <View style={styles.cardHeadRow}>
            <Speedometer size={18} color={C.naranja} variant="Bold" />
            <Text style={styles.cardHeadText}>Tacómetro al iniciar</Text>
          </View>
          {route.routeStartOdometerReading != null ? (
            <MetricRow
              label="Kilometraje"
              value={`${route.routeStartOdometerReading.toLocaleString("es-MX")} km`}
            />
          ) : null}
          {route.routeStartedAtCdmx ? (
            <MetricRow label="Inicio" value={formatWhen(route.routeStartedAtCdmx)} />
          ) : null}
          {route.routeStartOdometerEvidenceFileId ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbRow}
              nestedScrollEnabled
            >
              <EvidenceThumb fileId={route.routeStartOdometerEvidenceFileId} label="Tacómetro" />
            </ScrollView>
          ) : null}
        </AuditCard>
      ) : null}

      {hasEndAudit ? (
        <AuditCard title="Cierre de ruta" delayMs={nextDelay()} embedded={embedded}>
          <View style={styles.cardHeadRow}>
            <GasStation size={18} color={C.verdeHover} variant="Bold" />
            <Text style={styles.cardHeadText}>Combustible y tacómetro final</Text>
          </View>
          {route.routeEndOdometerReading != null ? (
            <MetricRow
              label="Kilometraje final"
              value={`${route.routeEndOdometerReading.toLocaleString("es-MX")} km`}
            />
          ) : null}
          {route.routeCompletedAtCdmx ? (
            <MetricRow label="Finalizada" value={formatWhen(route.routeCompletedAtCdmx)} />
          ) : null}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbRow}
            nestedScrollEnabled
          >
            {route.routeEndOdometerEvidenceFileId ? (
              <EvidenceThumb
                fileId={route.routeEndOdometerEvidenceFileId}
                label="Tacómetro final"
              />
            ) : null}
            {route.routeEndFuelEvidenceFileId ? (
              <EvidenceThumb fileId={route.routeEndFuelEvidenceFileId} label="Combustible" />
            ) : null}
          </ScrollView>
        </AuditCard>
      ) : null}

      {deliveryEvidenceStops.length > 0 ? (
        <AuditCard title="Evidencias de entrega" delayMs={nextDelay()} embedded={embedded}>
          {deliveryEvidenceStops.map((stop) => (
            <View key={stop.key} style={styles.stopBlock}>
              <View style={styles.stopHead}>
                <TickCircle size={16} color={C.verdeHover} variant="Bold" />
                <View style={styles.stopCopy}>
                  <Text style={styles.stopTitle}>{stop.title}</Text>
                  <Text style={styles.stopAddr} numberOfLines={2}>
                    {stop.address}
                  </Text>
                  {stop.deliveredAt ? (
                    <Text style={styles.stopWhen}>{formatWhen(stop.deliveredAt)}</Text>
                  ) : null}
                  {stop.deliveredUnits > 0 ? (
                    <Text style={styles.stopQty}>
                      {stop.deliveredUnits} {stop.deliveredUnits === 1 ? "ud. entregada" : "uds. entregadas"}
                    </Text>
                  ) : null}
                </View>
              </View>

              {stop.delivered && stop.evidenceIds.length === 0 && !stop.signature ? (
                <Text style={styles.missingAudit}>
                  Sin fotos ni firma guardadas para esta parada.
                </Text>
              ) : null}

              {stop.evidenceIds.length > 0 ? (
                <View style={styles.evidenceBlock}>
                  <Text style={styles.evidenceBlockLabel}>Fotos de evidencia</Text>
                  <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbRow}
            nestedScrollEnabled
          >
                    {stop.evidenceIds.map((fileId, index) => (
                      <EvidenceThumb
                        key={fileId}
                        fileId={fileId}
                        label={`Evidencia ${index + 1}`}
                      />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {stop.signature ? (
                <View style={styles.evidenceBlock}>
                  <Text style={styles.evidenceBlockLabel}>Firma del cliente</Text>
                  <SignaturePreview signature={stop.signature} label="Firma del cliente" />
                </View>
              ) : null}
            </View>
          ))}
        </AuditCard>
      ) : null}

      {deliveredStops.length > 0 ? (
        <AuditCard title="Resumen" delayMs={nextDelay()} embedded={embedded}>
          <MetricRow
            label="Paradas entregadas"
            value={`${deliveredStops.length} de ${ordered.length}`}
          />
          {route.routeCompletedByWorkerName ? (
            <MetricRow label="Cerrada por" value={route.routeCompletedByWorkerName} />
          ) : null}
        </AuditCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 14,
    gap: 14,
  },
  embeddedWrap: {
    marginTop: 4,
  },
  section: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: "rgba(255,255,255,0.82)",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  cardHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardHeadText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.corteza,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: C.gris,
  },
  metricValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "800",
    color: C.ink,
  },
  thumbRow: {
    marginTop: 4,
    flexGrow: 0,
  },
  evidenceBlock: {
    marginTop: 12,
  },
  evidenceBlockLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.gris,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  thumbWrap: {
    width: 108,
    marginRight: 10,
  },
  thumb: {
    width: 108,
    height: 82,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  thumbLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    color: C.gris,
  },
  stopBlock: {
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
  stopHead: {
    flexDirection: "row",
    gap: 10,
  },
  stopCopy: {
    flex: 1,
    minWidth: 0,
  },
  stopTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: C.ink,
  },
  stopAddr: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: C.gris,
    lineHeight: 17,
  },
  stopWhen: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: C.verdeHover,
  },
  stopQty: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: C.corteza,
  },
  missingAudit: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: C.gris,
    fontStyle: "italic",
  },
  signaturePreviewWrap: {
    width: "100%",
    maxWidth: 280,
  },
  signatureImg: {
    width: "100%",
    height: 108,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: C.line,
  },
});
