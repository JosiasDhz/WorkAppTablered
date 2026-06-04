import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { AttachSquare, DocumentText, Gallery, Trash } from "iconsax-react-native";
import { WebView } from "react-native-webview";
import { HeaderTitle } from "../../components/HeaderTitle";
import { TapImagePreview } from "../../components/TapImagePreview";
import { apiBaseUrl } from "../../api/http-common";
import {
  addMyDocumentFile,
  getMyExpedienteDocument,
  removeMyDocumentFile,
  uploadExpedienteEvidenceFile,
  type ExpedienteDocumentDetailDto,
  type ExpedienteDocumentFileEntryDto,
  type ExpedienteFileRefDto,
} from "../../services/workforceExpedienteService";
import { prepareEvidenceImageForUpload } from "../../utils/prepareEvidenceImageForUpload";
import {
  pickPdfDocuments,
  waitAfterImagePickerOnIos,
} from "../../utils/pickPdfDocument";

const COLORS = {
  bg: "#F7F7F6",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  border: "#E5E7EB",
  accent: "#EA7600",
};

type PendingFile = {
  id: string;
  uri: string;
  name: string;
  mimeType: string;
  isPdf: boolean;
};

function fileCountLabel(count: number) {
  if (count === 0) return "0 archivos";
  if (count === 1) return "1 archivo";
  return `${count} archivos`;
}

function isPdf(mimetype: string) {
  return mimetype.toLowerCase().includes("pdf");
}

function fileViewUrl(fileId: string) {
  if (!apiBaseUrl || !fileId) return null;
  return `${apiBaseUrl}/files/${fileId}/view`;
}

function fileImageUri(file: ExpedienteFileRefDto) {
  return file.thumbnailUrl || file.url || fileViewUrl(file.id);
}

function formatFileLabel(file: ExpedienteFileRefDto) {
  const ext = (file.extension || "").replace(/^\./, "");
  const raw =
    ext && !file.name.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
      ? `${file.name}.${ext}`
      : file.name;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function normalizeDetail(
  raw: ExpedienteDocumentDetailDto,
  fallbackName: string,
  fallbackRequired: boolean,
): ExpedienteDocumentDetailDto {
  const legacyFile = (raw as { file?: ExpedienteFileRefDto }).file;
  const files = Array.isArray(raw.files)
    ? raw.files
    : legacyFile
      ? [
          {
            id: legacyFile.id,
            file: legacyFile,
            uploadedAt: raw.uploadedAt,
            uploadedBy: raw.uploadedBy,
          },
        ]
      : [];
  return {
    ...raw,
    documentTypeName: raw.documentTypeName ?? fallbackName,
    isRequired: raw.isRequired ?? fallbackRequired,
    files,
    fileCount: files.length,
  };
}

function toErrorMessage(err: unknown) {
  const e = err as { message?: string | string[] };
  if (Array.isArray(e?.message)) return e.message.join(", ");
  return e?.message || "Ocurrió un error";
}

export default function MisExpedienteDocumentoScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const documentTypeId = route.params?.documentTypeId as string;
  const documentTypeName = (route.params?.documentTypeName as string) ?? "Documento";
  const isRequired = Boolean(route.params?.isRequired);

  const [detail, setDetail] = useState<ExpedienteDocumentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removingFileId, setRemovingFileId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const imagePickingRef = useRef(false);
  const pdfPickingRef = useRef(false);
  const loadSeqRef = useRef(0);

  const applyDetail = useCallback(
    (raw: ExpedienteDocumentDetailDto) => {
      setDetail(normalizeDetail(raw, documentTypeName, isRequired));
    },
    [documentTypeName, isRequired],
  );

  const load = useCallback(
    async (options?: { refresh?: boolean }) => {
      if (!documentTypeId) {
        setDetail(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const seq = ++loadSeqRef.current;
      const isRefresh = Boolean(options?.refresh);
      try {
        if (!isRefresh) setLoading(true);
        const data = await getMyExpedienteDocument(documentTypeId);
        if (seq !== loadSeqRef.current) return;
        applyDetail(data);
      } catch (err: unknown) {
        if (seq !== loadSeqRef.current) return;
        if (!isRefresh) {
          setDetail(null);
        } else {
          Alert.alert(
            "No se pudo actualizar",
            toErrorMessage(err),
          );
        }
      } finally {
        if (seq === loadSeqRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [documentTypeId, applyDetail],
  );

  useFocusEffect(
    useCallback(() => {
      if (submitting) return;
      void load();
    }, [load, submitting]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load({ refresh: true });
  };

  const removePending = (id: string) => {
    setPendingFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const onPickImage = () => {
    void addImage().finally(() => setPickerOpen(false));
  };

  const onPickPdf = () => {
    void addPdf().finally(() => setPickerOpen(false));
  };

  const addImage = async () => {
    if (imagePickingRef.current || submitting) return;
    imagePickingRef.current = true;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permiso requerido",
          "Activa el acceso a la galería para adjuntar imágenes.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.85,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      const assets = result.assets ?? [];
      if (result.canceled || assets.length === 0) return;

      const newItems: PendingFile[] = [];
      for (const asset of assets) {
        const prepared = await prepareEvidenceImageForUpload({
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
        });
        newItems.push({
          id: `${Date.now()}-img-${newItems.length}`,
          uri: prepared.uri,
          name: prepared.name,
          mimeType: prepared.mimeType,
          isPdf: false,
        });
      }
      if (newItems.length > 0) {
        setPendingFiles((prev) => [...prev, ...newItems]);
      }
    } catch {
      Alert.alert(
        "No se pudo procesar la imagen",
        "Intenta con otra foto o exporta la imagen como JPG desde tu galería.",
      );
    } finally {
      imagePickingRef.current = false;
      await waitAfterImagePickerOnIos();
    }
  };

  const addPdf = async () => {
    if (pdfPickingRef.current || submitting) return;
    pdfPickingRef.current = true;
    try {
      const assets = await pickPdfDocuments();
      if (assets.length === 0) return;

      const newItems: PendingFile[] = assets.map((asset, index) => {
        const mime = (asset.mimeType ?? "").toLowerCase();
        const name = asset.name ?? "";
        return {
          id: `${Date.now()}-pdf-${index}`,
          uri: asset.uri,
          name: name || `documento-${Date.now()}.pdf`,
          mimeType: mime || "application/pdf",
          isPdf: true,
        };
      });
      setPendingFiles((prev) => [...prev, ...newItems]);
    } catch (err: unknown) {
      const message = toErrorMessage(err);
      if (message.toLowerCase().includes("picking in progress")) {
        Alert.alert(
          "Espera un momento",
          "Cierra cualquier ventana abierta e intenta de nuevo en unos segundos.",
        );
        return;
      }
      Alert.alert("No se pudo abrir archivos", message);
    } finally {
      pdfPickingRef.current = false;
    }
  };

  const submitPending = async () => {
    if (pendingFiles.length === 0) return;
    const count = pendingFiles.length;
    const batch = [...pendingFiles];
    setSubmitting(true);
    loadSeqRef.current += 1;
    try {
      let latest: ExpedienteDocumentDetailDto | null = null;
      for (const item of batch) {
        const uploaded = await uploadExpedienteEvidenceFile({
          uri: item.uri,
          name: item.name,
          mimeType: item.mimeType,
        });
        latest = await addMyDocumentFile(documentTypeId, uploaded.id);
      }
      let savedCount = 0;
      if (latest) {
        applyDetail(latest);
        savedCount = normalizeDetail(latest, documentTypeName, isRequired).files.length;
      }
      setPendingFiles([]);
      Alert.alert(
        "Listo",
        count === 1
          ? savedCount > 1
            ? `Archivo guardado. Tienes ${savedCount} archivos en este documento.`
            : "Archivo guardado en tu expediente."
          : `Archivos guardados. Tienes ${savedCount} archivos en este documento.`,
      );
      await load({ refresh: true });
    } catch (err: unknown) {
      Alert.alert("Error", toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = (entry: ExpedienteDocumentFileEntryDto) => {
    Alert.alert("Eliminar archivo", "¿Quitar este archivo del expediente?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setRemovingFileId(entry.file.id);
            try {
              const updated = await removeMyDocumentFile(
                documentTypeId,
                entry.file.id,
              );
              applyDetail(updated);
            } catch (err: unknown) {
              Alert.alert("Error", toErrorMessage(err));
            } finally {
              setRemovingFileId(null);
            }
          })();
        },
      },
    ]);
  };

  const files = detail?.files ?? [];
  const savedCount = files.length;
  const pendingCount = pendingFiles.length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <HeaderTitle
        title={documentTypeName}
        subtitle={fileCountLabel(savedCount)}
        tone="light"
        onBack={() => navigation.goBack()}
      />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(tabBarHeight, insets.bottom) + 24,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.accent}
            />
          }
        >
          {isRequired ? (
            <Text style={styles.requiredHint}>Documento obligatorio</Text>
          ) : null}

          <Pressable
            style={[styles.dropZone, submitting && styles.dropZoneDisabled]}
            disabled={submitting}
            onPress={() => setPickerOpen(true)}
          >
            <AttachSquare size={32} color={COLORS.accent} variant="Linear" />
            <Text style={styles.dropTitle}>Adjuntar archivos</Text>
            <Text style={styles.dropSub}>
              Toca aquí · imágenes o PDF · varios archivos por documento
            </Text>
          </Pressable>

          {pendingCount > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Por subir ({pendingCount})
              </Text>
              <Text style={styles.sectionHint}>
                Revisa los archivos y pulsa Subir para añadirlos a los ya guardados.
              </Text>
              <View style={styles.fileGrid}>
                {pendingFiles.map((item) => (
                  <View key={item.id} style={styles.fileCard}>
                    {item.isPdf ? (
                      <View style={styles.previewBox}>
                        <DocumentText size={28} color={COLORS.accent} variant="Linear" />
                        <Text style={styles.pdfName} numberOfLines={2}>
                          {item.name}
                        </Text>
                      </View>
                    ) : (
                      <TapImagePreview uri={item.uri}>
                        <View style={styles.previewBox}>
                          <Image
                            source={{ uri: item.uri }}
                            style={styles.thumb}
                            resizeMode="cover"
                          />
                        </View>
                      </TapImagePreview>
                    )}
                    <Pressable
                      style={styles.deleteBtn}
                      disabled={submitting}
                      onPress={() => removePending(item.id)}
                    >
                      <Trash size={16} color="#DC2626" variant="Linear" />
                      <Text style={styles.deleteBtnText}>Quitar</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
              <Pressable
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                disabled={submitting}
                onPress={() => void submitPending()}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {pendingCount === 1
                      ? "Subir 1 archivo"
                      : `Subir ${pendingCount} archivos`}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Archivos guardados</Text>
            {files.length > 0 ? (
              <Text style={styles.sectionHint}>
                Para añadir más, usa Adjuntar arriba y luego Subir.
              </Text>
            ) : null}
            {files.length === 0 ? (
              <Text style={styles.emptyText}>Aún no hay archivos en este documento.</Text>
            ) : (
              <View style={styles.fileGrid}>
                {files.map((entry) => {
                  const file = entry.file;
                  const uri = fileImageUri(file);
                  const pdf = isPdf(file.mimetype);

                  return (
                    <View key={entry.id} style={styles.fileCard}>
                      {pdf && (file.url || fileViewUrl(file.id)) ? (
                        <Pressable
                          style={styles.previewBox}
                          onPress={() => {
                            setPdfTitle(formatFileLabel(file));
                            setPdfUri(file.url || fileViewUrl(file.id)!);
                          }}
                        >
                          <DocumentText size={28} color={COLORS.accent} variant="Linear" />
                          <Text style={styles.pdfName} numberOfLines={2}>
                            {formatFileLabel(file)}
                          </Text>
                          <Text style={styles.pdfAction}>Ver PDF</Text>
                        </Pressable>
                      ) : uri ? (
                        <TapImagePreview uri={uri}>
                          <View style={styles.previewBox}>
                            <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                          </View>
                        </TapImagePreview>
                      ) : (
                        <View style={styles.previewBox}>
                          <Text style={styles.unavailable}>Vista no disponible</Text>
                        </View>
                      )}
                      <Pressable
                        style={styles.deleteBtn}
                        disabled={removingFileId === file.id}
                        onPress={() => handleRemove(entry)}
                      >
                        {removingFileId === file.id ? (
                          <ActivityIndicator color="#DC2626" size="small" />
                        ) : (
                          <>
                            <Trash size={16} color="#DC2626" variant="Linear" />
                            <Text style={styles.deleteBtnText}>Eliminar</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPickerOpen(false)}
          />
          <View style={[styles.sheetCard, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <Text style={styles.sheetTitle}>Adjuntar archivos</Text>
            <Pressable style={styles.sheetOption} onPress={onPickImage}>
              <Gallery size={22} color={COLORS.accent} variant="Linear" />
              <Text style={styles.sheetOptionText}>Imagen</Text>
            </Pressable>
            <Pressable style={styles.sheetOption} onPress={onPickPdf}>
              <DocumentText size={22} color={COLORS.accent} variant="Linear" />
              <Text style={styles.sheetOptionText}>PDF</Text>
            </Pressable>
            <Pressable style={styles.sheetCancel} onPress={() => setPickerOpen(false)}>
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(pdfUri)}
        animationType="slide"
        onRequestClose={() => setPdfUri(null)}
      >
        <View style={[styles.pdfModal, { paddingBottom: insets.bottom }]}>
          <View style={[styles.pdfBar, { paddingTop: insets.top + 8 }]}>
            <Text style={styles.pdfBarTitle} numberOfLines={1}>
              {pdfTitle}
            </Text>
            <TouchableOpacity onPress={() => setPdfUri(null)}>
              <Text style={styles.pdfClose}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          {pdfUri ? (
            <WebView
              originWhitelist={["*"]}
              source={{ uri: pdfUri }}
              style={{ flex: 1 }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
              )}
            />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  requiredHint: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accent,
    marginBottom: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
  },
  fileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  fileCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  previewBox: {
    aspectRatio: 5 / 4,
    width: "100%",
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  pdfName: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  pdfAction: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accent,
  },
  unavailable: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 10,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  dropZone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#FDBA74",
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  dropZoneDisabled: { opacity: 0.65 },
  dropTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  dropSub: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheetCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
    textAlign: "center",
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  sheetCancel: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.muted,
  },
  submitBtn: {
    marginTop: 14,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pdfModal: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  pdfBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pdfBarTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginRight: 12,
  },
  pdfClose: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.accent,
  },
});
