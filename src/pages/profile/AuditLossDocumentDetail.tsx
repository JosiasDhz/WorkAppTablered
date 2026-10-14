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
import {
  ArrowRight2,
  DocumentText,
  Edit2,
  Maximize4,
  Refresh2,
  TickCircle,
} from "iconsax-react-native";
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
import { createThemedStyles } from "../../theme/themedStyles";
import { auditSoftCardStyle, useAuditUi, type AuditUi } from "./audit/auditUi";

type DocKind = "contract" | "delivery";

const DOC_LABEL: Record<DocKind, string> = {
  contract: "Acta de inventario",
  delivery: "Acta de entrega",
};

const signatureWebStyle = `.m-signature-pad--footer {display: none; margin: 0;} .m-signature-pad {box-shadow: none; border: none;} body,html {background: transparent;}`;

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(n);
}

function isDocSigned(item: MyLossDocumentItem | null, doc: DocKind): boolean {
  if (!item) return false;
  return doc === "contract"
    ? !!item.contractSignatureText
    : !!item.paymentFormSignatureText;
}

export default function AuditLossDocumentDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const allocationId = route.params?.allocationId as string | undefined;
  const token = useSelector((state: RootState) => state.auth.token);
  const ui = useAuditUi();
  const styles = useLossDocDetailStyles();

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
  const initialStepApplied = useRef(false);

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
    if (initialStepApplied.current || !item || steps.length === 0) return;
    initialStepApplied.current = true;
    const firstPending = steps.findIndex((doc) => !isDocSigned(item, doc));
    setStepIndex(firstPending >= 0 ? firstPending : 0);
  }, [item, steps]);

  useEffect(() => {
    if (stepIndex > Math.max(0, steps.length - 1)) {
      setStepIndex(0);
    }
  }, [steps.length, stepIndex]);

  const signedCount = steps.filter((doc) => isDocSigned(item, doc)).length;
  const allSigned = steps.length > 0 && signedCount === steps.length;

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
      const nextPending = steps.findIndex((d) => !isDocSigned(updated, d));
      if (nextPending >= 0) {
        setStepIndex(nextPending);
        Toast.show({
          type: "success",
          text1: "Firma guardada",
          text2: `Sigue con el ${DOC_LABEL[steps[nextPending]].toLowerCase()}.`,
        });
      } else {
        Toast.show({
          type: "success",
          text1: "¡Listo!",
          text2: "Ya firmaste todas tus actas.",
        });
      }
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
          style={{ flex: 1, backgroundColor: ui.field }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.pdfLoading}>
              <ActivityIndicator size="large" color={ui.accent} />
            </View>
          )}
        />
      </View>
    );
  };

  const renderSummary = (current: MyLossDocumentItem) => {
    const progress = steps.length > 0 ? signedCount / steps.length : 0;
    return (
      <View style={styles.summary}>
        <Text style={styles.summaryEyebrow}>MONTO A DESCONTAR</Text>
        <Text style={styles.summaryAmount}>{formatMoney(current.amount)}</Text>
        <View style={styles.chipRow}>
          <View style={[styles.chip, { backgroundColor: ui.accentSoft }]}>
            <Text style={[styles.chipText, { color: ui.accent }]}>
              {current.percentage}% de la pérdida
            </Text>
          </View>
          <View style={[styles.chip, { backgroundColor: ui.field }]}>
            <Text style={[styles.chipText, { color: ui.muted }]} numberOfLines={1}>
              {current.audit.warehouse?.name ?? "Sin almacén"}
            </Text>
          </View>
        </View>
        <Text style={styles.summaryFamily} numberOfLines={2}>
          {auditFamilyDisplayLabel(current.family)}
        </Text>

        {steps.length > 0 ? (
          <View style={styles.summaryFooter}>
            <View style={styles.progressBlock}>
              <Text style={styles.progressText}>
                {signedCount} de {steps.length}{" "}
                {steps.length === 1 ? "acta firmada" : "actas firmadas"}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.round(progress * 100)}%`,
                      backgroundColor: allSigned ? ui.green : ui.accent,
                    },
                  ]}
                />
              </View>
            </View>
            <SoftPressable
              onPress={handleOpenAudit}
              scaleTo={0.97}
              style={styles.auditLinkWrap}
            >
              <View style={styles.auditLink}>
                <Text style={styles.auditLinkText}>Ver auditoría</Text>
                <ArrowRight2 size={14} color={ui.accent} variant="Linear" />
              </View>
            </SoftPressable>
          </View>
        ) : null}
      </View>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabs}>
      {steps.map((doc, index) => {
        const active = index === stepIndex;
        const signed = isDocSigned(item, doc);
        return (
          <View key={doc} style={styles.tabSlot}>
            <SoftPressable onPress={() => setStepIndex(index)} scaleTo={0.98}>
              <View style={[styles.tab, active && styles.tabActive]}>
                {signed ? (
                  <TickCircle size={16} color={ui.green} variant="Bold" />
                ) : (
                  <View
                    style={[
                      styles.tabDot,
                      { backgroundColor: active ? ui.accent : ui.muted },
                    ]}
                  />
                )}
                <Text
                  style={[styles.tabText, active && styles.tabTextActive]}
                  numberOfLines={1}
                >
                  {DOC_LABEL[doc]}
                </Text>
              </View>
            </SoftPressable>
          </View>
        );
      })}
    </View>
  );

  const renderActaContent = (doc: DocKind) => {
    const isContract = doc === "contract";
    const sigValue = isContract ? contractSig : paymentSig;
    const setSigValue = isContract ? setContractSig : setPaymentSig;
    const sigRef = isContract ? contractSigRef : paymentSigRef;
    const locked = isDocSigned(item, doc);

    const handleClearSig = () => {
      sigRef.current?.clearSignature?.();
      setSigValue("");
    };

    return (
      <View style={styles.block}>
        <View style={styles.blockHead}>
          <View style={[styles.docIcon, { backgroundColor: ui.accentSoft }]}>
            <DocumentText size={18} color={ui.accent} variant="Linear" />
          </View>
          <View style={styles.blockHeadCopy}>
            <Text style={styles.blockLabel}>{DOC_LABEL[doc]}</Text>
            <View
              style={[
                styles.statusChip,
                { backgroundColor: locked ? ui.greenSoft : ui.amberSoft },
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  { color: locked ? ui.green : ui.amber },
                ]}
              >
                {locked ? "Firmada" : "Pendiente de firma"}
              </Text>
            </View>
          </View>
          <SoftPressable
            onPress={() => setPdfDoc(doc)}
            scaleTo={0.95}
            style={styles.expandBtnWrap}
            accessibilityLabel={`Ver ${DOC_LABEL[doc]} en pantalla completa`}
          >
            <View style={styles.expandBtn}>
              <Maximize4 size={18} color={ui.ink} variant="Linear" />
            </View>
          </SoftPressable>
        </View>

        {renderInlinePdf(doc)}

        <View style={styles.sigSection}>
          <Text style={styles.sigLabel}>Tu firma</Text>
          {!locked ? (
            <Text style={styles.sigHint}>
              Revisa el acta y firma dentro del recuadro.
            </Text>
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
            <View style={styles.lockedStamp}>
              <TickCircle size={14} color={ui.green} variant="Bold" />
              <Text style={styles.lockedStampText}>Firmado</Text>
            </View>
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
              <View pointerEvents="none" style={styles.signatureGuide}>
                {!sigValue ? (
                  <View style={styles.signaturePlaceholder}>
                    <Edit2 size={16} color={ui.muted} variant="Linear" />
                    <Text style={styles.signaturePlaceholderText}>Firma aquí</Text>
                  </View>
                ) : null}
                <View style={styles.signatureBaselineRow}>
                  <Text style={styles.signatureCross}>✕</Text>
                  <View style={styles.signatureBaseline} />
                </View>
              </View>
            </View>
            <View style={styles.sigActions}>
              <View style={styles.sigSlotGhost}>
                <SoftPressable
                  onPress={handleClearSig}
                  scaleTo={0.98}
                  accessibilityLabel="Limpiar firma"
                >
                  <View style={[styles.sigBtn, styles.sigBtnGhost]}>
                    <Refresh2 size={16} color={ui.ink} variant="Linear" />
                    <Text style={styles.sigBtnGhostText}>Limpiar</Text>
                  </View>
                </SoftPressable>
              </View>
              <View style={styles.sigSlot}>
                <SoftPressable
                  onPress={() => handleSaveOne(doc)}
                  disabled={saving || !sigValue}
                  scaleTo={0.98}
                  style={saving || !sigValue ? styles.saveBtnDisabled : undefined}
                >
                  <View style={[styles.sigBtn, styles.sigBtnSave]}>
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <TickCircle size={16} color="#FFFFFF" variant="Linear" />
                    )}
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

  return (
    <SafeAreaView style={styles.safe} edges={headerSafeEdges("top", "left", "right")}>
      <HeaderTitle
        title="Firmar actas"
        subtitle={allSigned ? "Todo firmado" : "Revisa y firma"}
        tone="light"
        style={styles.header}
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
      />
      {loading || !item ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ui.accent} />
        </View>
      ) : (
        <ScrollView
          scrollEnabled={!isSigning}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderSummary(item)}

          {allSigned ? (
            <View style={styles.doneBanner}>
              <TickCircle size={20} color={ui.green} variant="Bold" />
              <Text style={styles.doneBannerText}>
                Ya firmaste {steps.length === 1 ? "tu acta" : "todas tus actas"}. No tienes
                nada pendiente aquí.
              </Text>
            </View>
          ) : null}

          {steps.length === 0 ? (
            <Text style={styles.muted}>No hay documentos generados para esta asignación.</Text>
          ) : (
            <>
              {steps.length > 1 ? renderTabs() : null}
              {currentDoc ? renderActaContent(currentDoc) : null}
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
                  <ActivityIndicator size="large" color={ui.accent} />
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

function buildLossDocDetailStyles(ui: AuditUi) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: "transparent" },
    header: { paddingHorizontal: SCREEN_GUTTER },
    scrollContent: {
      paddingHorizontal: SCREEN_GUTTER,
      paddingTop: 4,
      paddingBottom: 36,
      gap: 14,
    },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    muted: { fontSize: 14, fontWeight: "500", color: ui.muted, textAlign: "center" },
    summary: {
      ...auditSoftCardStyle(ui),
      padding: 16,
    },
    summaryEyebrow: {
      fontSize: 11,
      fontWeight: "800",
      color: ui.muted,
      letterSpacing: 0.6,
    },
    summaryAmount: {
      marginTop: 4,
      fontSize: 30,
      fontWeight: "800",
      color: ui.ink,
      letterSpacing: -0.5,
      fontVariant: ["tabular-nums"],
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 10,
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      maxWidth: "100%",
    },
    chipText: { fontSize: 12, fontWeight: "700" },
    summaryFamily: {
      marginTop: 10,
      fontSize: 13,
      fontWeight: "600",
      color: ui.ink,
      lineHeight: 18,
    },
    summaryFooter: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ui.divider,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    progressBlock: { flex: 1, gap: 6 },
    progressText: { fontSize: 12, fontWeight: "700", color: ui.ink },
    progressTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: ui.field,
      overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: 999 },
    auditLinkWrap: { width: "auto" },
    auditLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    auditLinkText: { fontSize: 13, fontWeight: "700", color: ui.accent },
    doneBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: ui.greenSoft,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    doneBannerText: {
      flex: 1,
      fontSize: 13,
      fontWeight: "700",
      color: ui.green,
      lineHeight: 18,
    },
    tabs: {
      flexDirection: "row",
      gap: 4,
      padding: 4,
      borderRadius: 14,
      backgroundColor: ui.field,
    },
    tabSlot: { flex: 1 },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 11,
    },
    tabActive: {
      backgroundColor: ui.surface,
      shadowColor: ui.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 1,
    },
    tabDot: { width: 7, height: 7, borderRadius: 4 },
    tabText: { fontSize: 13, fontWeight: "600", color: ui.muted },
    tabTextActive: { color: ui.ink, fontWeight: "800" },
    block: {
      ...auditSoftCardStyle(ui),
      padding: 14,
    },
    blockHead: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      gap: 10,
    },
    docIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    blockHeadCopy: { flex: 1, gap: 4, alignItems: "flex-start" },
    blockLabel: { fontSize: 15, fontWeight: "800", color: ui.ink },
    statusChip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
    },
    statusChipText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
    expandBtnWrap: { width: 40 },
    expandBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: ui.field,
      alignItems: "center",
      justifyContent: "center",
    },
    pdfFrame: {
      height: 380,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: ui.field,
    },
    pdfPlaceholder: {
      height: 380,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.field,
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
    sigSection: { marginTop: 16, gap: 2 },
    sigLabel: { fontSize: 14, fontWeight: "800", color: ui.ink },
    sigHint: { fontSize: 12, fontWeight: "500", color: ui.muted },
    signatureBox: {
      marginTop: 8,
      height: 190,
      borderRadius: 14,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: ui.divider,
      backgroundColor: ui.surface,
      overflow: "hidden",
    },
    signatureGuide: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 30,
    },
    signaturePlaceholder: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "center",
      marginTop: 40,
    },
    signaturePlaceholderText: {
      fontSize: 14,
      fontWeight: "600",
      color: ui.muted,
    },
    signatureBaselineRow: {
      marginTop: "auto",
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
    },
    signatureCross: { fontSize: 14, fontWeight: "700", color: ui.muted },
    signatureBaseline: {
      flex: 1,
      height: 1,
      marginBottom: 4,
      backgroundColor: ui.divider,
    },
    signatureLockedBox: {
      marginTop: 8,
      height: 150,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: ui.greenSoft,
      backgroundColor: ui.surface,
      alignItems: "center",
      justifyContent: "center",
      padding: 10,
    },
    signatureLockedImg: {
      width: "100%",
      height: "100%",
    },
    lockedStamp: {
      position: "absolute",
      top: 8,
      right: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: ui.greenSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    lockedStampText: {
      color: ui.green,
      fontSize: 11,
      fontWeight: "800",
    },
    sigActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
    },
    sigSlotGhost: { flex: 1 },
    sigSlot: { flex: 2 },
    sigBtn: {
      flexDirection: "row",
      gap: 6,
      minHeight: 48,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    sigBtnGhost: {
      backgroundColor: ui.field,
    },
    sigBtnGhostText: {
      color: ui.ink,
      fontSize: 14,
      fontWeight: "700",
    },
    sigBtnSave: {
      backgroundColor: ui.accent,
    },
    sigBtnSaveText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    saveBtnDisabled: { opacity: 0.5 },
    pdfWrap: { flex: 1, backgroundColor: ui.surface },
    pdfTopBar: {
      paddingHorizontal: SCREEN_GUTTER,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: ui.divider,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pdfTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: ui.ink,
      flex: 1,
      marginRight: 12,
    },
    pdfCloseBtnWrap: {
      width: 80,
    },
    pdfCloseBtn: {
      borderRadius: 999,
      backgroundColor: ui.ink,
      paddingHorizontal: 12,
      paddingVertical: 7,
      alignItems: "center",
    },
    pdfCloseText: { color: ui.surface, fontWeight: "700", fontSize: 12 },
  });
}

const useLossDocDetailStyles = createThemedStyles(
  useAuditUi,
  buildLossDocDetailStyles,
);
