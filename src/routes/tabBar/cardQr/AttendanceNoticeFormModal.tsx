import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, CloseCircle, Gallery, Trash } from "iconsax-react-native";
import { TAB_BAR_PRIMARY } from "../tabBarConstants";
import {
  ATTENDANCE_NOTICE_TYPE_OPTIONS,
  createAttendanceNotice,
  getMyAttendanceNoticeToday,
  uploadAttendanceNoticeEvidenceFile,
  type AttendanceNoticeDto,
  type AttendanceNoticeType,
} from "../../../services/workforceAttendanceNoticeService";
import { prepareEvidenceImageForUpload } from "../../../utils/prepareEvidenceImageForUpload";

type LocalPhoto = {
  uri: string;
  name: string;
  mimeType: string;
};

type AttendanceNoticeFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (notice: AttendanceNoticeDto) => void;
};

export function AttendanceNoticeFormModal({
  visible,
  onClose,
  onSubmitted,
}: AttendanceNoticeFormModalProps) {
  const [noticeType, setNoticeType] = useState<AttendanceNoticeType>("EXPECTED_LATE");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<LocalPhoto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [existingNotice, setExistingNotice] = useState<AttendanceNoticeDto | null>(null);

  useEffect(() => {
    if (!visible) return;
    setNoticeType("EXPECTED_LATE");
    setDescription("");
    setPhoto(null);
    setExistingNotice(null);
    setLoadingExisting(true);
    void getMyAttendanceNoticeToday()
      .then((notice) => setExistingNotice(notice))
      .catch(() => setExistingNotice(null))
      .finally(() => setLoadingExisting(false));
  }, [visible]);

  const capturePhoto = async (source: "camera" | "gallery") => {
    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permiso requerido", "Activa la cámara para tomar la evidencia.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.85,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      try {
        const prepared = await prepareEvidenceImageForUpload({
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
        });
        setPhoto({
          uri: prepared.uri,
          name: prepared.name,
          mimeType: prepared.mimeType,
        });
      } catch {
        Alert.alert("No se pudo procesar la foto", "Intenta con otra imagen.");
      }
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Activa el acceso a la galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    try {
      const prepared = await prepareEvidenceImageForUpload({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
      setPhoto({
        uri: prepared.uri,
        name: prepared.name,
        mimeType: prepared.mimeType,
      });
    } catch {
      Alert.alert("No se pudo procesar la foto", "Intenta con otra imagen.");
    }
  };

  const submit = async () => {
    const desc = description.trim();
    if (!desc) {
      Alert.alert("Descripción requerida", "Explica por qué no checarás o llegarás tarde.");
      return;
    }
    if (!photo) {
      Alert.alert("Foto requerida", "Adjunta una evidencia fotográfica.");
      return;
    }

    setSubmitting(true);
    try {
      const uploaded = await uploadAttendanceNoticeEvidenceFile(photo);
      const notice = await createAttendanceNotice({
        noticeType,
        description: desc,
        evidenceFileId: uploaded.id,
      });
      Alert.alert("Aviso enviado", "RH podrá ver tu incidencia solicitada en el reporte de asistencias.", [
        { text: "OK", onPress: () => {
          onSubmitted?.(notice);
          onClose();
        }},
      ]);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo enviar el aviso.";
      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Aviso de incidencia</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Cerrar">
              <CloseCircle size={24} color="#64748B" variant="Bold" />
            </Pressable>
          </View>

          {loadingExisting ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={TAB_BAR_PRIMARY} />
            </View>
          ) : existingNotice ? (
            <View style={styles.existingBox}>
              <Text style={styles.existingTitle}>Ya enviaste un aviso hoy</Text>
              <Text style={styles.existingType}>{existingNotice.noticeTypeLabel}</Text>
              <Text style={styles.existingDescription}>{existingNotice.description}</Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
            >
              <Text style={styles.label}>Motivo</Text>
              <View style={styles.typeRow}>
                {ATTENDANCE_NOTICE_TYPE_OPTIONS.map((option) => {
                  const selected = noticeType === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setNoticeType(option.value)}
                      style={[styles.typeChip, selected && styles.typeChipSelected]}
                    >
                      <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Explica tu situación…"
                placeholderTextColor="#94A3B8"
                multiline
                maxLength={2000}
                style={styles.textArea}
              />

              <Text style={styles.label}>Evidencia fotográfica</Text>
              {photo ? (
                <View style={styles.photoPreviewWrap}>
                  <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                  <Pressable
                    onPress={() => setPhoto(null)}
                    style={styles.removePhotoBtn}
                    accessibilityLabel="Quitar foto"
                  >
                    <Trash size={18} color="#FFFFFF" variant="Bold" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.photoActions}>
                  <Pressable style={styles.photoBtn} onPress={() => void capturePhoto("camera")}>
                    <Camera size={20} color={TAB_BAR_PRIMARY} variant="Bold" />
                    <Text style={styles.photoBtnText}>Tomar foto</Text>
                  </Pressable>
                  <Pressable style={styles.photoBtn} onPress={() => void capturePhoto("gallery")}>
                    <Gallery size={20} color={TAB_BAR_PRIMARY} variant="Bold" />
                    <Text style={styles.photoBtnText}>Galería</Text>
                  </Pressable>
                </View>
              )}

              <Pressable
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                disabled={submitting}
                onPress={() => void submit()}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Enviar aviso</Text>
                )}
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: "center",
  },
  existingBox: {
    margin: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  existingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#9A3412",
  },
  existingType: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#C2410C",
  },
  existingDescription: {
    marginTop: 8,
    fontSize: 14,
    color: "#7C2D12",
    lineHeight: 20,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginTop: 4,
  },
  typeRow: {
    gap: 8,
  },
  typeChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
  },
  typeChipSelected: {
    borderColor: TAB_BAR_PRIMARY,
    backgroundColor: "#FFF7ED",
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  typeChipTextSelected: {
    color: TAB_BAR_PRIMARY,
  },
  textArea: {
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0F172A",
    textAlignVertical: "top",
    backgroundColor: "#FFFFFF",
  },
  photoActions: {
    flexDirection: "row",
    gap: 10,
  },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
  },
  photoBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: TAB_BAR_PRIMARY,
  },
  photoPreviewWrap: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: 180,
    backgroundColor: "#F1F5F9",
  },
  removePhotoBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtn: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: TAB_BAR_PRIMARY,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
