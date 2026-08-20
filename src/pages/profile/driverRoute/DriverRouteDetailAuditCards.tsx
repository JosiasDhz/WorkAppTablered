import React, { useMemo } from "react";
import {
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

const COLORS = {
  surface: "#FFFFFF",
  ink: "#1C1C1E",
  muted: "#8E8E93",
  accent: "#EA7600",
};

const ACCENT_SOFT = "rgba(234, 118, 0, 0.14)";
const DONE = "#16A34A";
const DONE_SOFT = "rgba(22, 163, 74, 0.16)";

type DriverRouteDetailAuditCardsProps = {
  detail: DriverRouteAssignmentDemo;
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

function AuditImagePreview(props: {
  uri: string;
  label: string;
  imageStyle: object;
  wrapStyle?: object;
  resizeMode?: ImageResizeMode;
}) {
  const headers = useTableredFileImageHeaders(props.uri);
  const source = useMemo((): ImageSourcePropType => {
    return headers ? { uri: props.uri, headers } : { uri: props.uri };
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

function EvidenceStrip({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.thumbRow}
      nestedScrollEnabled
    >
      {children}
    </ScrollView>
  );
}

function AuditCard(props: {
  icon: React.ReactNode;
  wellBg: string;
  title: string;
  stamp?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={[styles.iconWell, { backgroundColor: props.wellBg }]}>
          {props.icon}
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {props.title}
          </Text>
          {props.stamp ? (
            <Text style={styles.cardStamp} numberOfLines={1}>
              {props.stamp}
            </Text>
          ) : null}
        </View>
      </View>
      {props.children}
    </View>
  );
}

export function DriverRouteDetailAuditCards({
  detail,
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

  return (
    <View style={styles.wrap}>
      {hasStartAudit ? (
        <AuditCard
          icon={<Speedometer size={20} color={COLORS.accent} variant="Linear" />}
          wellBg={ACCENT_SOFT}
          title="Salida de ruta"
          stamp={
            route.routeStartedAtCdmx
              ? formatWhen(route.routeStartedAtCdmx)
              : "Registrada"
          }
        >
          {route.routeStartOdometerReading != null ? (
            <MetricRow
              label="Kilometraje"
              value={`${route.routeStartOdometerReading.toLocaleString("es-MX")} km`}
            />
          ) : null}
          {route.routeStartOdometerEvidenceFileId ? (
            <EvidenceStrip>
              <EvidenceThumb
                fileId={route.routeStartOdometerEvidenceFileId}
                label="Tacómetro"
              />
            </EvidenceStrip>
          ) : null}
        </AuditCard>
      ) : null}

      {deliveryEvidenceStops.map((stop) => (
        <AuditCard
          key={stop.key}
          icon={<TickCircle size={20} color={DONE} variant="Linear" />}
          wellBg={DONE_SOFT}
          title={stop.title}
          stamp={
            stop.deliveredAt
              ? formatWhen(stop.deliveredAt)
              : stop.delivered
                ? "Entregada"
                : "Sin cierre"
          }
        >
          {stop.address ? (
            <Text style={styles.addr} numberOfLines={2}>
              {stop.address}
            </Text>
          ) : null}
          {stop.deliveredUnits > 0 ? (
            <Text style={styles.qty}>
              {stop.deliveredUnits}{" "}
              {stop.deliveredUnits === 1 ? "ud. entregada" : "uds. entregadas"}
            </Text>
          ) : null}
          {stop.delivered && stop.evidenceIds.length === 0 && !stop.signature ? (
            <Text style={styles.missing}>
              Sin fotos ni firma guardadas para esta parada.
            </Text>
          ) : null}
          {stop.evidenceIds.length > 0 ? (
            <EvidenceStrip>
              {stop.evidenceIds.map((fileId, index) => (
                <EvidenceThumb
                  key={fileId}
                  fileId={fileId}
                  label={`Evidencia ${index + 1}`}
                />
              ))}
            </EvidenceStrip>
          ) : null}
          {stop.signature ? (
            <View style={styles.signatureBlock}>
              <Text style={styles.evidenceLabel}>Firma del cliente</Text>
              <SignaturePreview signature={stop.signature} label="Firma del cliente" />
            </View>
          ) : null}
        </AuditCard>
      ))}

      {hasEndAudit ? (
        <AuditCard
          icon={<GasStation size={20} color={DONE} variant="Linear" />}
          wellBg={DONE_SOFT}
          title="Cierre de ruta"
          stamp={
            route.routeCompletedAtCdmx
              ? formatWhen(route.routeCompletedAtCdmx)
              : "Cerrada"
          }
        >
          {route.routeEndOdometerReading != null ? (
            <MetricRow
              label="Kilometraje final"
              value={`${route.routeEndOdometerReading.toLocaleString("es-MX")} km`}
            />
          ) : null}
          {route.routeEndOdometerEvidenceFileId || route.routeEndFuelEvidenceFileId ? (
            <EvidenceStrip>
              {route.routeEndOdometerEvidenceFileId ? (
                <EvidenceThumb
                  fileId={route.routeEndOdometerEvidenceFileId}
                  label="Tacómetro final"
                />
              ) : null}
              {route.routeEndFuelEvidenceFileId ? (
                <EvidenceThumb
                  fileId={route.routeEndFuelEvidenceFileId}
                  label="Combustible"
                />
              ) : null}
            </EvidenceStrip>
          ) : null}
        </AuditCard>
      ) : null}

      {deliveredStops.length > 0 ? (
        <AuditCard
          icon={<TickCircle size={20} color={DONE} variant="Linear" />}
          wellBg={DONE_SOFT}
          title="Resumen"
          stamp={`${deliveredStops.length} de ${ordered.length} paradas`}
        >
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
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWell: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.ink,
  },
  cardStamp: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
  },
  metricValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.ink,
  },
  addr: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: COLORS.muted,
  },
  qty: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.accent,
  },
  missing: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
  },
  thumbRow: {
    flexGrow: 0,
  },
  thumbWrap: {
    width: 108,
    marginRight: 10,
  },
  thumb: {
    width: 108,
    height: 82,
    borderRadius: 12,
    backgroundColor: ACCENT_SOFT,
  },
  thumbLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.muted,
  },
  signatureBlock: {
    gap: 8,
  },
  evidenceLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  signaturePreviewWrap: {
    width: "100%",
    maxWidth: 280,
  },
  signatureImg: {
    width: "100%",
    height: 108,
    borderRadius: 12,
    backgroundColor: ACCENT_SOFT,
  },
});
