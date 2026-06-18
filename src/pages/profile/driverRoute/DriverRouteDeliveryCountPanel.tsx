import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ArrowRight2, Location } from "iconsax-react-native";
import {
  DriverRouteDeliveryEvidencePhotos,
  isDriverRouteDeliveryEvidenceComplete,
  type DriverRouteDeliveryEvidencePhotosState,
} from "./DriverRouteDeliveryEvidencePhotos";
import {
  allDeliveryQuantitiesMatched,
  deliveryPaymentChangeMxn,
  formatMoneyMxn,
  isDeliveryPaymentComplete,
  isDeliveryPaymentRequired,
  isDeliveryPaymentUnderpaid,
  parseRouteQty,
  type DeliveryLineView,
  type DeliveryPaymentView,
} from "./deliveryLinesFromDestination";

type DeliveryProgressStep = {
  key: string;
  label: string;
  done: boolean;
};

type DriverRouteDeliveryCountPanelProps = {
  addressLine?: string;
  lines: DeliveryLineView[];
  payment: DeliveryPaymentView | null;
  deliveredByRecordId: Record<string, string>;
  amountReceivedRaw: string;
  evidencePhotos: DriverRouteDeliveryEvidencePhotosState;
  onChangeQty: (recordId: string, text: string) => void;
  onChangeAmountReceived: (text: string) => void;
  onChangeEvidencePhotos: (photos: DriverRouteDeliveryEvidencePhotosState) => void;
  onContinue: () => void;
};

export function DriverRouteDeliveryCountPanel({
  addressLine,
  lines,
  payment,
  deliveredByRecordId,
  amountReceivedRaw,
  evidencePhotos,
  onChangeQty,
  onChangeAmountReceived,
  onChangeEvidencePhotos,
  onContinue,
}: DriverRouteDeliveryCountPanelProps) {
  const paymentRequired = isDeliveryPaymentRequired(payment);
  const allMatched = useMemo(
    () => allDeliveryQuantitiesMatched(lines, deliveredByRecordId),
    [lines, deliveredByRecordId],
  );
  const photosComplete = useMemo(
    () => isDriverRouteDeliveryEvidenceComplete(evidencePhotos),
    [evidencePhotos],
  );
  const paymentComplete = useMemo(
    () => isDeliveryPaymentComplete(payment, amountReceivedRaw),
    [payment, amountReceivedRaw],
  );
  const paymentUnderpaid = useMemo(
    () => isDeliveryPaymentUnderpaid(payment, amountReceivedRaw),
    [payment, amountReceivedRaw],
  );
  const changeMxn = useMemo(
    () => deliveryPaymentChangeMxn(payment, amountReceivedRaw),
    [payment, amountReceivedRaw],
  );
  const canContinue = allMatched && photosComplete && paymentComplete;
  const progressSteps = useMemo((): DeliveryProgressStep[] => {
    const steps: DeliveryProgressStep[] = [
      {
        key: "qty",
        label: "Cantidades registradas",
        done: allMatched,
      },
      {
        key: "photos",
        label: "Al menos una foto de evidencia",
        done: photosComplete,
      },
    ];
    if (paymentRequired) {
      steps.push({
        key: "payment",
        label: paymentUnderpaid
          ? `Cobro mínimo ${formatMoneyMxn(payment!.amountToCollectMxn)}`
          : "Monto recibido del cliente",
        done: paymentComplete && !paymentUnderpaid,
      });
    }
    return steps;
  }, [
    allMatched,
    photosComplete,
    paymentComplete,
    paymentRequired,
    paymentUnderpaid,
    payment,
  ]);
  const progressDone = progressSteps.filter((step) => step.done).length;
  const progressRatio =
    progressSteps.length > 0 ? progressDone / progressSteps.length : 0;

  return (
    <KeyboardAwareScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={48}
      nestedScrollEnabled
    >
        {addressLine ? (
          <View style={styles.addressStrip}>
            <View style={styles.addressIcon}>
              <Location size={16} color="#EA7600" variant="Bold" />
            </View>
            <Text style={styles.addressText} numberOfLines={2}>
              {addressLine}
            </Text>
          </View>
        ) : null}
        {lines.length > 1 ? (
          <Text style={styles.sectionKicker}>
            Productos · {lines.length}
          </Text>
        ) : null}
        {lines.map((line, index) => {
          const raw = deliveredByRecordId[line.recordId] ?? "";
          const parsed = parseRouteQty(raw);
          const hasQty = /\d/.test(raw.trim());
          const over = hasQty && parsed > line.expectedQty;
          const under = hasQty && parsed < line.expectedQty;
          return (
            <View key={line.recordId} style={styles.lineCard}>
              {lines.length > 1 ? (
                <View style={styles.lineBadge}>
                  <Text style={styles.lineBadgeTxt}>{index + 1}</Text>
                </View>
              ) : null}
              <Text
                style={[styles.prodName, lines.length > 1 ? styles.prodNameWithBadge : null]}
                numberOfLines={4}
              >
                {line.productName}
              </Text>
              <Text style={styles.folio}>{line.saleFolio}</Text>
              <View style={styles.qtyRow}>
                <View style={styles.qtyCol}>
                  <Text style={styles.qtyLbl}>En ruta</Text>
                  <Text style={styles.qtyExpected}>{line.expectedQty}</Text>
                </View>
                <View style={styles.qtyDivider} />
                <View style={styles.qtyCol}>
                  <Text style={styles.qtyLbl}>Entregado</Text>
                  <TextInput
                    value={raw}
                    onChangeText={(t) => onChangeQty(line.recordId, t)}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={6}
                    style={[styles.input, over || under ? styles.inputWarn : null]}
                    accessibilityLabel={`Cantidad entregada de ${line.productName}`}
                  />
                </View>
              </View>
              {over ? (
                <Text style={styles.warn}>
                  No puede superar lo asignado ({line.expectedQty}).
                </Text>
              ) : null}
              {under ? (
                <Text style={styles.warn}>
                  Debe coincidir con lo asignado ({line.expectedQty}).
                </Text>
              ) : null}
            </View>
          );
        })}
        {paymentRequired && payment ? (
          <View style={styles.paymentCard}>
            <Text style={styles.sectionKicker}>Cobro pendiente</Text>
            <View style={styles.paymentDueBox}>
              <Text style={styles.paymentDueLbl}>Debes cobrar</Text>
              <Text style={styles.paymentDueAmt}>
                {formatMoneyMxn(payment.amountToCollectMxn)}
              </Text>
            </View>
            <Text style={styles.paymentInputLbl}>Monto recibido</Text>
            <TextInput
              value={amountReceivedRaw}
              onChangeText={onChangeAmountReceived}
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              inputMode="decimal"
              maxLength={12}
              style={[
                styles.input,
                styles.inputMoney,
                paymentUnderpaid ? styles.inputWarn : null,
              ]}
              accessibilityLabel="Monto recibido del cliente"
            />
            {changeMxn != null && changeMxn > 0 ? (
              <View style={styles.changeWrap}>
                <Text style={styles.changeLbl}>Cambio a entregar</Text>
                <Text style={styles.changeAmt}>{formatMoneyMxn(changeMxn)}</Text>
              </View>
            ) : null}
            {paymentUnderpaid ? (
              <Text style={styles.warn}>
                El monto recibido no cubre lo pendiente (
                {formatMoneyMxn(payment.amountToCollectMxn)}).
              </Text>
            ) : null}
          </View>
        ) : null}
        <DriverRouteDeliveryEvidencePhotos
          photos={evidencePhotos}
          onChange={onChangeEvidencePhotos}
        />
        {!canContinue ? (
          <View style={styles.progressCard}>
            <View style={styles.progressHead}>
              <Text style={styles.progressTitle}>Progreso</Text>
              <Text style={styles.progressCount}>
                {progressDone}/{progressSteps.length}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progressRatio * 100)}%` },
                ]}
              />
            </View>
            {progressSteps.map((step, stepIndex) => (
              <View
                key={step.key}
                style={[
                  styles.progressStep,
                  stepIndex === progressSteps.length - 1 ? styles.progressStepLast : null,
                ]}
              >
                <View
                  style={[
                    styles.progressDot,
                    step.done ? styles.progressDotDone : null,
                  ]}
                />
                <Text
                  style={[
                    styles.progressStepLabel,
                    step.done ? styles.progressStepLabelDone : null,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      <View style={styles.footer}>
        <Pressable
          style={[styles.nextBtn, !canContinue ? styles.nextBtnDisabled : null]}
          onPress={onContinue}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
          accessibilityLabel="Continuar a firma"
        >
          <Text
            style={[
              styles.nextBtnTxt,
              !canContinue ? styles.nextBtnTxtDisabled : null,
            ]}
          >
            Continuar a firma
          </Text>
          <ArrowRight2
            size={20}
            color={canContinue ? "#FFFFFF" : "#94A3B8"}
            variant="Bold"
          />
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 12,
  },
  addressStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    lineHeight: 18,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EA7600",
    textTransform: "uppercase",
    letterSpacing: 0.45,
    marginBottom: 8,
  },
  lineCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  lineBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  lineBadgeTxt: {
    fontSize: 11,
    fontWeight: "900",
    color: "#64748B",
  },
  prodName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 19,
  },
  prodNameWithBadge: {
    paddingRight: 28,
  },
  folio: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  qtyRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "stretch",
  },
  qtyCol: {
    flex: 1,
  },
  qtyDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 14,
  },
  qtyLbl: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  qtyExpected: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
    textAlign: "center",
  },
  inputMoney: {
    textAlign: "left",
    fontSize: 18,
  },
  inputWarn: {
    borderColor: "#F97316",
    backgroundColor: "#FFF7ED",
  },
  warn: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#C2410C",
  },
  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  paymentDueBox: {
    marginTop: 4,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  paymentDueLbl: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  paymentDueAmt: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
  },
  paymentInputLbl: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  changeWrap: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  changeLbl: {
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
  },
  changeAmt: {
    fontSize: 18,
    fontWeight: "900",
    color: "#065F46",
  },
  progressCard: {
    marginTop: 4,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  progressHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  progressCount: {
    fontSize: 12,
    fontWeight: "800",
    color: "#EA7600",
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#EA7600",
  },
  progressStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  progressStepLast: {
    marginBottom: 0,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
  },
  progressDotDone: {
    backgroundColor: "#EA7600",
  },
  progressStepLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    lineHeight: 18,
  },
  progressStepLabelDone: {
    color: "#0F172A",
    fontWeight: "700",
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  nextBtn: {
    height: 56,
    borderRadius: 999,
    backgroundColor: "#EA7600",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.22,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
  nextBtnDisabled: {
    backgroundColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: { elevation: 0 },
    }),
  },
  nextBtnTxt: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  nextBtnTxtDisabled: {
    color: "#94A3B8",
  },
});
