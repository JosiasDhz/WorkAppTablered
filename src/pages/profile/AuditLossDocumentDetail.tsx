import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import SignatureScreen from "react-native-signature-canvas";
import { WebView } from "react-native-webview";
import { useSelector } from "react-redux";
import { ProfileScreenHeader } from "../../components/ProfileScreenHeader";
import { RootState } from "../../redux/store/store";
import {
  getMyLossDocumentById,
  getMyLossDocumentPdfUrl,
  patchMyLossDocumentSignatures,
  auditFamilyDisplayLabel,
  type MyLossDocumentItem,
} from "../../services/inventoryAuditService";

type DocKind = "contract" | "delivery";

const COLORS = {
  bg: "#F7F7F6",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  border: "#EEF1F4",
  accent: "#EA7600",
  blue: "#1D4ED8",
  blueSoft: "#EFF6FF",
};

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
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:9005";

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
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <ProfileScreenHeader title="Documento" />
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
            uri: `${apiUrl}${getMyLossDocumentPdfUrl(allocationId, doc)}`,
            headers: { Authorization: `Bearer ${token}` },
          }}
          style={{ flex: 1, backgroundColor: "#F1F5F9" }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.pdfLoading}>
              <ActivityIndicator size="large" color={COLORS.blue} />
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
          <TouchableOpacity
            style={styles.pdfBtn}
            onPress={() => setPdfDoc(doc)}
            activeOpacity={0.85}
          >
            <Text style={styles.pdfBtnText}>Abrir PDF</Text>
          </TouchableOpacity>
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
              <TouchableOpacity
                style={[styles.sigBtn, styles.sigBtnGhost]}
                onPress={handleClearSig}
                activeOpacity={0.85}
              >
                <Text style={styles.sigBtnGhostText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sigBtn,
                  styles.sigBtnSave,
                  saving && styles.saveBtnDisabled,
                ]}
                onPress={() => handleSaveOne(doc)}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Text style={styles.sigBtnSaveText}>
                  {saving ? "Guardando..." : "Guardar firma"}
                </Text>
              </TouchableOpacity>
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
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ProfileScreenHeader title="Documentos" subtitle="Revisa y firma" />
      {loading || !item ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <ScrollView
          scrollEnabled={!isSigning}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 144,
          }}
        >
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>
              {auditFamilyDisplayLabel(item.family)}
            </Text>
            <Text style={styles.summaryMeta}>
              {item.audit.warehouse?.name ?? "Sin almacén"} · {item.percentage}% · {formatMoney(item.amount)}
            </Text>
            <TouchableOpacity
              style={styles.summaryBtn}
              onPress={handleOpenAudit}
              activeOpacity={0.85}
            >
              <Text style={styles.summaryBtnText}>Ver auditoría</Text>
            </TouchableOpacity>
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
                  <TouchableOpacity
                    style={[styles.navBtn, !canPrev && styles.navBtnDisabled]}
                    onPress={() => canPrev && setStepIndex((i) => i - 1)}
                    disabled={!canPrev}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.navBtnText,
                        !canPrev && styles.navBtnTextDisabled,
                      ]}
                    >
                      ‹ Anterior
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.navBtn,
                      styles.navBtnPrimary,
                      !canNext && styles.navBtnDisabled,
                    ]}
                    onPress={() => canNext && setStepIndex((i) => i + 1)}
                    disabled={!canNext}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.navBtnText,
                        styles.navBtnTextPrimary,
                        !canNext && styles.navBtnTextDisabled,
                      ]}
                    >
                      Siguiente ›
                    </Text>
                  </TouchableOpacity>
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
            <TouchableOpacity
              style={styles.pdfCloseBtn}
              onPress={() => setPdfDoc(null)}
            >
              <Text style={styles.pdfCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          {pdfDoc && allocationId && token ? (
            <WebView
              originWhitelist={["*"]}
              source={{
                uri: `${apiUrl}${getMyLossDocumentPdfUrl(allocationId, pdfDoc)}`,
                headers: { Authorization: `Bearer ${token}` },
              }}
              style={{ flex: 1 }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.pdfLoading}>
                  <ActivityIndicator size="large" color={COLORS.blue} />
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
  safe: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  muted: { fontSize: 14, color: COLORS.muted, textAlign: "center" },
  summary: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 14,
  },
  summaryTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  summaryMeta: { marginTop: 6, fontSize: 12, fontWeight: "700", color: COLORS.muted },
  summaryBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#16A34A",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  summaryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  stepsBar: {
    marginBottom: 8,
    alignSelf: "flex-start",
    backgroundColor: COLORS.blueSoft,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  stepsText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.blue,
    letterSpacing: 0.4,
  },
  block: { marginBottom: 18 },
  blockHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  blockLabel: { fontSize: 15, fontWeight: "900", color: COLORS.text, flex: 1 },
  pdfBtn: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pdfBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.4,
  },
  pdfFrame: {
    height: 420,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D9E1EC",
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  pdfPlaceholder: {
    height: 420,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D9E1EC",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
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
    fontWeight: "900",
    color: COLORS.text,
  },
  lockedBadge: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  lockedBadgeText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  signatureBox: {
    marginTop: 6,
    height: 170,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },
  signatureLockedBox: {
    marginTop: 6,
    height: 130,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#86EFAC",
    backgroundColor: "#F0FDF4",
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
  sigBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sigBtnGhost: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sigBtnGhostText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  sigBtnSave: {
    backgroundColor: COLORS.blue,
  },
  sigBtnSaveText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  navRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  navBtnPrimary: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  navBtnDisabled: {
    opacity: 0.45,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  navBtnTextPrimary: {
    color: "#FFFFFF",
  },
  navBtnTextDisabled: {
    color: COLORS.muted,
  },
  saveBtnDisabled: { opacity: 0.6 },
  pdfWrap: { flex: 1, backgroundColor: "#FFFFFF" },
  pdfTopBar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pdfTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A", flex: 1, marginRight: 12 },
  pdfCloseBtn: {
    borderRadius: 10,
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pdfCloseText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
});
