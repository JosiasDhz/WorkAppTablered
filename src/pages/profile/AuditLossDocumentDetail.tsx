import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import SignatureScreen from "react-native-signature-canvas";
import { WebView } from "react-native-webview";
import { useSelector } from "react-redux";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SoftPressable } from "../../components/SoftPressable";
import { headerSafeEdges } from "../../routes/headerSafeEdges";
import { SCREEN_GUTTER } from "../../theme/layout";
import { RootState } from "../../redux/store/store";
import {
  getMyLossDocumentById,
  getMyLossDocumentPdfUrl,
  patchMyLossDocumentSignatures,
  auditFamilyDisplayLabel,
  type MyLossDocumentItem,
} from "../../services/inventoryAuditService";
import { apiBaseUrl } from "../../api/http-common";
import { AUDIT_UI, auditSoftCardStyle } from "./audit/auditUi";

type DocKind = "contract" | "delivery";

const DOC_LABEL: Record<DocKind, string> = {
  contract: "ACTA DE INVENTARIO",
  delivery: "ACTA DE ENTREGA",
};

const signatureWebStyle = `.m-signature-pad--footer {display: none; margin: 0;} .m-signature-pad {box-shadow: none; border: none;}`;

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(n);
}

export default function AuditLossDocumentDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const allocationId = route.params?.allocationId as string | undefined;
  const token = useSelector((state: RootState) => state.auth.token);

  const [item, setItem] = useState<MyLossDocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contractSig, setContractSig] = useState("");
  const [paymentSig, setPaymentSig] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<DocKind | null>(null);
  const contractSigRef = useRef<any>(null);
  const paymentSigRef = useRef<any>(null);

  const load = useCallback(async () => {
    if (!allocationId) {
      setItem(null);
      setLoading(false);
      return;
    }
    try {
      const data = await getMyLossDocumentById(allocationId);
      setItem(data);
      setContractSig(data.contractSignatureText ?? "");
      setPaymentSig(data.paymentFormSignatureText ?? "");
    } catch {
      setItem(null);
      Toast.show({ type: "error", text1: "No se pudo cargar el documento." });
    } finally {
      setLoading(false);
    }
  }, [allocationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const steps = useMemo<DocKind[]>(() => {
    if (!item) return [];
    const list: DocKind[] = [];
    if (item.generateContract) list.push("contract");
    if (item.generatePaymentForm) list.push("delivery");
    return list;
  }, [item]);

  useEffect(() => {
    if (stepIndex > Math.max(0, steps.length - 1)) {
      setStepIndex(0);
    }
  }, [steps.length, stepIndex]);

  const handleSaveOne = async (doc: DocKind) => {
    if (!allocationId) return;
    const sigValue = doc === "contract" ? contractSig : paymentSig;
    if (!sigValue) {
      Toast.show({
        type: "error",
        text1: "Firma requerida",
        text2: "Dibuja tu firma antes de guardar.",
      });
      return;
    }
    setSaving(true);
    try {
      const payload =
        doc === "contract"
          ? { contractSignatureText: sigValue }
          : { paymentFormSignatureText: sigValue };
      const updated = await patchMyLossDocumentSignatures(allocationId, payload);
      setItem(updated);
      Toast.show({ type: "success", text1: "Firma guardada." });
    } catch {
      Toast.show({ type: "error", text1: "No se pudo guardar." });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAudit = () => {
    if (!item?.audit?.id) return;
    navigation.navigate("InventoryAuditDetail", { auditId: item.audit.id });
  };

  if (!allocationId) {
    return (
      <SafeAreaView style={styles.safe} edges={headerSafeEdges("top", "left", "right")}>
        <HeaderTitle
          title="Documento"
          tone="light"
          style={styles.header}
          onBack={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
        />
        <View style={styles.centered}>
          <Text style={styles.muted}>Identificador no válido.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderInlinePdf = (doc: DocKind) => {
    if (!token) {
      return (
        <View style={styles.pdfPlaceholder}>
          <Text style={styles.muted}>Sesión expirada</Text>
        </View>
      );
    }
    return (
      <View style={styles.pdfFrame}>
        <WebView
          originWhitelist={["*"]}
          source={{
            uri: `${apiBaseUrl}${getMyLossDocumentPdfUrl(allocationId, doc)}`,
            headers: { Authorization: `Bearer ${token}` },
          }}
          style={{ flex: 1, backgroundColor: AUDIT_UI.field }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.pdfLoading}>
              <ActivityIndicator size="large" color={AUDIT_UI.accent} />
            </View>
          )}
        />
      </View>
    );
  };

  const isDocLocked = (doc: DocKind): boolean => {
    if (!item) return false;
    return doc === "contract"
      ? !!item.contractSignatureText
      : !!item.paymentFormSignatureText;
  };

  const renderActaContent = (doc: DocKind) => {
    const isContract = doc === "contract";
    const sigValue = isContract ? contractSig : paymentSig;
    const setSigValue = isContract ? setContractSig : setPaymentSig;
    const sigRef = isContract ? contractSigRef : paymentSigRef;
    const locked = isDocLocked(doc);

    const handleClearSig = () => {
      sigRef.current?.clearSignature?.();
      setSigValue("");
    };

    return (
      <View style={styles.block}>
        <View style={styles.blockHead}>
          <Text style={styles.blockLabel}>{DOC_LABEL[doc]}</Text>
          <SoftPressable
            style={styles.pdfBtnWrap}
            onPress={() => setPdfDoc(doc)}
            scaleTo={0.97}
          >
            <View style={styles.pdfBtn}>
              <Text style={styles.pdfBtnText}>Abrir PDF</Text>
            </View>
          </SoftPressable>
        </View>

        {renderInlinePdf(doc)}

        <View style={styles.sigHead}>
          <Text style={styles.sigLabel}>
            {locked ? "Firma registrada" : "Firma después de revisar"}
          </Text>
          {locked ? (
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedBadgeText}>Firmado</Text>
            </View>
          ) : null}
        </View>

        {locked ? (
          <View style={styles.signatureLockedBox}>
            {sigValue ? (
              <Image
                source={{ uri: sigValue }}
                style={styles.signatureLockedImg}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.muted}>Firma guardada</Text>
            )}
          </View>
        ) : (
          <>
            <View style={styles.signatureBox}>
              <SignatureScreen
                ref={sigRef}
                webStyle={signatureWebStyle}
                dataURL={sigValue || undefined}
                onOK={(signature) => setSigValue(signature)}
                onEmpty={() => setSigValue("")}
                onBegin={() => setIsSigning(true)}
                onEnd={() => {
                  setIsSigning(false);
                  sigRef.current?.readSignature?.();
                }}
                descriptionText="Firma aquí"
                clearText="Limpiar"
                confirmText="Aceptar"
                autoClear={false}
              />
            </View>
            <View style={styles.sigActions}>
              <View style={styles.sigSlot}>
                <SoftPressable onPress={handleClearSig} scaleTo={0.98}>
                  <View style={[styles.sigBtn, styles.sigBtnGhost]}>
                    <Text style={styles.sigBtnGhostText}>Limpiar</Text>
                  </View>
                </SoftPressable>
              </View>
              <View style={styles.sigSlot}>
                <SoftPressable
                  onPress={() => handleSaveOne(doc)}
                  disabled={saving}
                  scaleTo={0.98}
                  style={saving ? styles.saveBtnDisabled : undefined}
                >
                  <View style={[styles.sigBtn, styles.sigBtnSave]}>
                    <Text style={styles.sigBtnSaveText}>
                      {saving ? "Guardando..." : "Guardar firma"}
                    </Text>
                  </View>
                </SoftPressable>
              </View>
            </View>
          </>
        )}
      </View>
    );
  };

  const currentDoc = steps[stepIndex];
  const totalSteps = steps.length;
  const canPrev = stepIndex > 0;
  const canNext = stepIndex < totalSteps - 1;

  return (
    <SafeAreaView style={styles.safe} edges={headerSafeEdges("top", "left", "right")}>
      <HeaderTitle
        title="Documentos"
        subtitle="Revisa y firma"
        tone="light"
        style={styles.header}
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
      />
      {loading || !item ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AUDIT_UI.accent} />
        </View>
      ) : (
        <ScrollView
          scrollEnabled={!isSigning}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>
              {auditFamilyDisplayLabel(item.family)}
            </Text>
            <Text style={styles.summaryMeta}>
              {item.audit.warehouse?.name ?? "Sin almacén"} · {item.percentage}% · {formatMoney(item.amount)}
            </Text>
            <SoftPressable onPress={handleOpenAudit} scaleTo={0.97} style={styles.summaryBtnWrap}>
              <View style={styles.summaryBtn}>
                <Text style={styles.summaryBtnText}>Ver auditoría</Text>
              </View>
            </SoftPressable>
          </View>

          {totalSteps === 0 ? (
            <Text style={styles.muted}>No hay documentos generados para esta asignación.</Text>
          ) : (
            <>
              {totalSteps > 1 ? (
                <View style={styles.stepsBar}>
                  <Text style={styles.stepsText}>
                    Documento {stepIndex + 1} de {totalSteps}
                  </Text>
                </View>
              ) : null}

              {currentDoc ? renderActaContent(currentDoc) : null}

              {totalSteps > 1 ? (
                <View style={styles.navRow}>
                  <View style={styles.navSlot}>
                    <SoftPressable
                      onPress={() => canPrev && setStepIndex((i) => i - 1)}
                      disabled={!canPrev}
                      scaleTo={0.98}
                      style={!canPrev ? styles.navBtnDisabled : undefined}
                    >
                      <View style={styles.navBtn}>
                        <Text
                          style={[
                            styles.navBtnText,
                            !canPrev && styles.navBtnTextDisabled,
                          ]}
                        >
                          ‹ Anterior
                        </Text>
                      </View>
                    </SoftPressable>
                  </View>
                  <View style={styles.navSlot}>
                    <SoftPressable
                      onPress={() => canNext && setStepIndex((i) => i + 1)}
                      disabled={!canNext}
                      scaleTo={0.98}
                      style={!canNext ? styles.navBtnDisabled : undefined}
                    >
                      <View style={[styles.navBtn, styles.navBtnPrimary]}>
                        <Text
                          style={[
                            styles.navBtnText,
                            styles.navBtnTextPrimary,
                            !canNext && styles.navBtnTextDisabled,
                          ]}
                        >
                          Siguiente ›
                        </Text>
                      </View>
                    </SoftPressable>
                  </View>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      )}

      <Modal
        visible={pdfDoc !== null}
        animationType="slide"
        onRequestClose={() => setPdfDoc(null)}
      >
        <View style={[styles.pdfWrap, { paddingBottom: insets.bottom }]}>
          <View
            style={[
              styles.pdfTopBar,
              { paddingTop: insets.top + 10 },
            ]}
          >
            <Text style={styles.pdfTitle} numberOfLines={1}>
              {pdfDoc ? DOC_LABEL[pdfDoc] : ""}
            </Text>
            <SoftPressable
              style={styles.pdfCloseBtnWrap}
              onPress={() => setPdfDoc(null)}
              scaleTo={0.97}
            >
              <View style={styles.pdfCloseBtn}>
                <Text style={styles.pdfCloseText}>Cerrar</Text>
              </View>
            </SoftPressable>
          </View>
          {pdfDoc && allocationId && token ? (
            <WebView
              originWhitelist={["*"]}
              source={{
                uri: `${apiBaseUrl}${getMyLossDocumentPdfUrl(allocationId, pdfDoc)}`,
                headers: { Authorization: `Bearer ${token}` },
              }}
              style={{ flex: 1 }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.pdfLoading}>
                  <ActivityIndicator size="large" color={AUDIT_UI.accent} />
                </View>
              )}
            />
          ) : (
            <View style={styles.centered}>
              <Text style={styles.muted}>No se pudo abrir el PDF.</Text>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  header: { paddingHorizontal: SCREEN_GUTTER },
  scrollContent: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 4,
    paddingBottom: 36,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  muted: { fontSize: 14, fontWeight: "500", color: AUDIT_UI.muted, textAlign: "center" },
  summary: {
    ...auditSoftCardStyle(),
    padding: 14,
    marginBottom: 14,
  },
  summaryTitle: { fontSize: 16, fontWeight: "700", color: AUDIT_UI.ink },
  summaryMeta: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "500",
    color: AUDIT_UI.muted,
  },
  summaryBtnWrap: {
    marginTop: 12,
    width: 130,
  },
  summaryBtn: {
    alignSelf: "flex-start",
    backgroundColor: AUDIT_UI.green,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  summaryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  stepsBar: {
    marginBottom: 10,
    alignSelf: "flex-start",
    backgroundColor: AUDIT_UI.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  stepsText: {
    fontSize: 11,
    fontWeight: "800",
    color: AUDIT_UI.accent,
    letterSpacing: 0.3,
  },
  block: {
    ...auditSoftCardStyle(),
    padding: 14,
    marginBottom: 14,
  },
  blockHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  blockLabel: { fontSize: 14, fontWeight: "800", color: AUDIT_UI.ink, flex: 1 },
  pdfBtnWrap: {
    width: 96,
  },
  pdfBtn: {
    backgroundColor: AUDIT_UI.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
  },
  pdfBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  pdfFrame: {
    height: 420,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: AUDIT_UI.field,
  },
  pdfPlaceholder: {
    height: 420,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AUDIT_UI.field,
  },
  pdfLoading: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  sigHead: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sigLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: AUDIT_UI.ink,
  },
  lockedBadge: {
    backgroundColor: AUDIT_UI.greenSoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  lockedBadgeText: {
    color: AUDIT_UI.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  signatureBox: {
    marginTop: 6,
    height: 170,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AUDIT_UI.divider,
    backgroundColor: AUDIT_UI.surface,
    overflow: "hidden",
  },
  signatureLockedBox: {
    marginTop: 6,
    height: 130,
    borderRadius: 12,
    backgroundColor: AUDIT_UI.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  signatureLockedImg: {
    width: "100%",
    height: "100%",
  },
  sigActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  sigSlot: { flex: 1 },
  sigBtn: {
    paddingVertical: 11,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  sigBtnGhost: {
    backgroundColor: AUDIT_UI.field,
  },
  sigBtnGhostText: {
    color: AUDIT_UI.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  sigBtnSave: {
    backgroundColor: AUDIT_UI.accent,
  },
  sigBtnSaveText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  navRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  navSlot: { flex: 1 },
  navBtn: {
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: AUDIT_UI.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AUDIT_UI.divider,
    alignItems: "center",
  },
  navBtnPrimary: {
    backgroundColor: AUDIT_UI.accent,
    borderColor: AUDIT_UI.accent,
  },
  navBtnDisabled: {
    opacity: 0.45,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: AUDIT_UI.ink,
    letterSpacing: 0.2,
  },
  navBtnTextPrimary: {
    color: "#FFFFFF",
  },
  navBtnTextDisabled: {
    color: AUDIT_UI.muted,
  },
  saveBtnDisabled: { opacity: 0.6 },
  pdfWrap: { flex: 1, backgroundColor: AUDIT_UI.surface },
  pdfTopBar: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: AUDIT_UI.divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pdfTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: AUDIT_UI.ink,
    flex: 1,
    marginRight: 12,
  },
  pdfCloseBtnWrap: {
    width: 80,
  },
  pdfCloseBtn: {
    borderRadius: 999,
    backgroundColor: AUDIT_UI.ink,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: "center",
  },
  pdfCloseText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
});
