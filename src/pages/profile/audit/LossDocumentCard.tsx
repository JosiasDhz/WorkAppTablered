import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ArrowRight2, DocumentText1, TickCircle } from "iconsax-react-native";
import { SoftPressable } from "../../../components/SoftPressable";
import {
  auditFamilyDisplayLabel,
  type MyLossDocumentListItem,
} from "../../../services/inventoryAuditService";
import { formatInventoryAuditCalendarDateMX } from "../../../utils/auditCalendarDates";
import { createThemedStyles } from "../../../theme/themedStyles";
import { auditSoftCardStyle, useAuditUi, type AuditUi } from "./auditUi";

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(n);
}

export function lossDocumentSignatureProgress(item: MyLossDocumentListItem) {
  const required =
    (item.generateContract ? 1 : 0) + (item.generatePaymentForm ? 1 : 0);
  const signed =
    (item.generateContract && item.contractSigned ? 1 : 0) +
    (item.generatePaymentForm && item.paymentFormSigned ? 1 : 0);
  return { required, signed };
}

function statusCopy(required: number, signed: number) {
  if (required === 0) return "Sin actas";
  if (signed >= required) return required === 1 ? "Firmada" : "Firmadas";
  const missing = required - signed;
  return missing === 1 ? "Falta 1 firma" : `Faltan ${missing} firmas`;
}

function LossDocumentCardBase({
  item,
  onPress,
}: {
  item: MyLossDocumentListItem;
  onPress: (allocationId: string) => void;
}) {
  const ui = useAuditUi();
  const styles = useLossDocumentCardStyles();
  const { required, signed } = lossDocumentSignatureProgress(item);
  const done = required > 0 && signed >= required;
  const tone = done
    ? { color: ui.green, soft: ui.greenSoft }
    : { color: ui.amber, soft: ui.amberSoft };
  const label = auditFamilyDisplayLabel(item.family);
  const docs = [
    item.generateContract ? "Inventario" : null,
    item.generatePaymentForm ? "Entrega" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <SoftPressable
      onPress={() => onPress(item.allocationId)}
      scaleTo={0.99}
      accessibilityLabel={`${label}, ${statusCopy(required, signed)}`}
    >
      <View style={styles.card}>
        <View style={styles.top}>
          <View style={[styles.iconWell, { backgroundColor: tone.soft }]}>
            {done ? (
              <TickCircle size={20} color={tone.color} variant="Bold" />
            ) : (
              <DocumentText1 size={20} color={tone.color} variant="Linear" />
            )}
          </View>
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={2}>
              {label}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.audit.warehouse?.name ?? "Sin almacén"} · Auditoría{" "}
              {item.audit.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {formatInventoryAuditCalendarDateMX(item.audit.scheduledStartDate)} –{" "}
              {formatInventoryAuditCalendarDateMX(item.audit.scheduledEndDate)}
            </Text>
          </View>
          <ArrowRight2 size={16} color={ui.muted} variant="Linear" />
        </View>

        <View style={styles.bottom}>
          <View>
            <Text style={styles.amountLabel}>A descontar</Text>
            <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
          </View>
          <View style={styles.statusCol}>
            <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
              <Text style={[styles.statusText, { color: tone.color }]}>
                {statusCopy(required, signed)}
              </Text>
            </View>
            {docs ? <Text style={styles.docs}>{docs}</Text> : null}
          </View>
        </View>
      </View>
    </SoftPressable>
  );
}

export const LossDocumentCard = memo(LossDocumentCardBase);

function buildLossDocumentCardStyles(ui: AuditUi) {
  return StyleSheet.create({
    card: {
      ...auditSoftCardStyle(ui),
      padding: 14,
      gap: 14,
    },
    top: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    iconWell: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    copy: { flex: 1, minWidth: 0, gap: 3 },
    title: { fontSize: 15, fontWeight: "700", color: ui.ink, lineHeight: 20 },
    meta: { fontSize: 12, fontWeight: "500", color: ui.muted },
    bottom: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ui.divider,
    },
    amountLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: ui.muted,
      letterSpacing: 0.3,
    },
    amount: {
      marginTop: 2,
      fontSize: 20,
      fontWeight: "800",
      color: ui.rose,
      fontVariant: ["tabular-nums"],
    },
    statusCol: { alignItems: "flex-end", gap: 4 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    statusText: { fontSize: 12, fontWeight: "800" },
    docs: { fontSize: 11, fontWeight: "600", color: ui.muted },
  });
}

const useLossDocumentCardStyles = createThemedStyles(
  useAuditUi,
  buildLossDocumentCardStyles,
);
