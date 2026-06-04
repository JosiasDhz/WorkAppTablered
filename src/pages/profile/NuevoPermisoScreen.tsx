import React, { useMemo, useState } from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { AttachSquare, Calendar1, DocumentText, Trash } from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import {
  createPermissionRequest,
  uploadPermissionEvidenceFile,
} from "../../services/workforcePermissionRequestService";
import { prepareEvidenceImageForUpload } from "../../utils/prepareEvidenceImageForUpload";
import { formatWorkforceYmd } from "../../utils/formatWorkforceYmd";

const COLORS = {
  bg: "#F7F7F6",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  border: "#E5E7EB",
  accent: "#EA7600",
};

const MAX_EVIDENCE = 5;

type LocalEvidence = {
  id: string;
  uri: string;
  name: string;
  mimeType: string;
  isPdf: boolean;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function localYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function NuevoPermisoScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [description, setDescription] = useState("");
  const [permissionDate, setPermissionDate] = useState(todayStart());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerDraft, setDatePickerDraft] = useState(todayStart());
  const [evidence, setEvidence] = useState<LocalEvidence[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const dateLabel = useMemo(() => localYmd(permissionDate), [permissionDate]);

  const openDatePicker = () => {
    setDatePickerDraft(permissionDate);
    setDatePickerOpen(true);
  };

  const closeDatePicker = () => setDatePickerOpen(false);

  const confirmDatePicker = () => {
    setPermissionDate(datePickerDraft);
    closeDatePicker();
  };

  const onAndroidDateChange = (event: { type: string }, selected?: Date) => {
    if (event.type === "dismissed") {
      closeDatePicker();
      return;
    }
    if (selected) setPermissionDate(selected);
    closeDatePicker();
  };

  const addImage = async () => {
    if (evidence.length >= MAX_EVIDENCE) {
      Alert.alert("Límite", `Máximo ${MAX_EVIDENCE} archivos de evidencia`);
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Activa el acceso a la galería para adjuntar imágenes.");
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
      setEvidence((prev) => [
        ...prev,
        {
          id: `${Date.now()}-img`,
          uri: prepared.uri,
          name: prepared.name,
          mimeType: prepared.mimeType,
          isPdf: false,
        },
      ]);
    } catch {
      Alert.alert(
        "No se pudo procesar la imagen",
        "Intenta con otra foto o exporta la imagen como JPG desde tu galería.",
      );
    }
  };

  const addPdf = async () => {
    if (evidence.length >= MAX_EVIDENCE) {
      Alert.alert("Límite", `Máximo ${MAX_EVIDENCE} archivos de evidencia`);
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setEvidence((prev) => [
      ...prev,
      {
        id: `${Date.now()}-pdf`,
        uri: asset.uri,
        name: asset.name || `documento-${Date.now()}.pdf`,
        mimeType: asset.mimeType || "application/pdf",
        isPdf: true,
      },
    ]);
  };

  const removeEvidence = (id: string) => {
    setEvidence((prev) => prev.filter((item) => item.id !== id));
  };

  const submit = async () => {
    const desc = description.trim();
    if (!desc) {
      Alert.alert("Descripción requerida", "Explica el motivo del permiso.");
      return;
    }
    if (evidence.length === 0) {
      Alert.alert("Evidencia requerida", "Adjunta al menos una imagen o PDF.");
      return;
    }

    setSubmitting(true);
    try {
      const fileIds: string[] = [];
      for (const item of evidence) {
        const uploaded = await uploadPermissionEvidenceFile({
          uri: item.uri,
          name: item.name,
          mimeType: item.mimeType,
        });
        if (uploaded?.id) fileIds.push(uploaded.id);
      }
      if (fileIds.length === 0) {
        throw new Error("No se pudieron subir los archivos");
      }
      await createPermissionRequest({
        description: desc,
        permissionDate: dateLabel,
        fileIds,
      });
      Alert.alert("Solicitud enviada", "Tu permiso quedó pendiente de revisión.", [
        {
          text: "OK",
          onPress: () => navigation.navigate("MisPermisos"),
        },
      ]);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || "No se pudo enviar la solicitud";
      Alert.alert("Error", String(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <HeaderTitle title="Solicitar permiso" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(tabBarHeight, insets.bottom) + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Fecha del permiso</Text>
        <Pressable style={styles.dateBtn} onPress={openDatePicker}>
          <Calendar1 size={18} color={COLORS.accent} variant="Linear" />
          <Text style={styles.dateText}>{formatWorkforceYmd(localYmd(permissionDate))}</Text>
        </Pressable>

        <Text style={[styles.label, { marginTop: 20 }]}>Descripción</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Motivo del permiso…"
          placeholderTextColor={COLORS.muted}
          multiline
          numberOfLines={4}
          style={styles.textarea}
          textAlignVertical="top"
        />

        <Text style={[styles.label, { marginTop: 20 }]}>Evidencias</Text>
        <Text style={styles.hint}>Imágenes o PDF (máx. {MAX_EVIDENCE})</Text>
        <View style={styles.attachRow}>
          <Pressable style={styles.attachBtn} onPress={() => void addImage()}>
            <AttachSquare size={18} color={COLORS.accent} variant="Linear" />
            <Text style={styles.attachBtnText}>Imagen</Text>
          </Pressable>
          <Pressable style={styles.attachBtn} onPress={() => void addPdf()}>
            <DocumentText size={18} color={COLORS.accent} variant="Linear" />
            <Text style={styles.attachBtnText}>PDF</Text>
          </Pressable>
        </View>

        {evidence.map((item) => (
          <View key={item.id} style={styles.evidenceCard}>
            {item.isPdf ? (
              <View style={styles.pdfPreview}>
                <DocumentText size={28} color={COLORS.accent} variant="Linear" />
                <Text style={styles.pdfName} numberOfLines={2}>
                  {item.name}
                </Text>
              </View>
            ) : (
              <Image source={{ uri: item.uri }} style={styles.thumb} />
            )}
            <Pressable
              style={styles.removeBtn}
              onPress={() => removeEvidence(item.id)}
            >
              <Trash size={18} color="#DC2626" variant="Linear" />
            </Pressable>
          </View>
        ))}

        <Pressable
          style={[styles.submitBtn, submitting && styles.submitDisabled]}
          disabled={submitting}
          onPress={() => void submit()}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Enviar solicitud</Text>
          )}
        </Pressable>
      </ScrollView>

      {Platform.OS === "android" && datePickerOpen ? (
        <DateTimePicker
          value={permissionDate}
          mode="date"
          display="default"
          locale="es-MX"
          minimumDate={todayStart()}
          onChange={onAndroidDateChange}
        />
      ) : null}

      <Modal
        visible={datePickerOpen && Platform.OS === "ios"}
        transparent
        animationType="fade"
        onRequestClose={closeDatePicker}
      >
        <View style={styles.pickerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDatePicker} />
          <View style={[styles.pickerCard, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <Text style={styles.pickerTitle}>Fecha del permiso</Text>
            <DateTimePicker
              value={datePickerDraft}
              mode="date"
              display="spinner"
              locale="es-MX"
              minimumDate={todayStart()}
              onChange={(_, selected) => {
                if (selected) setDatePickerDraft(selected);
              }}
              themeVariant="light"
            />
            <Pressable style={styles.pickerConfirm} onPress={confirmDatePicker}>
              <Text style={styles.pickerConfirmText}>Listo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 10,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  pickerCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  pickerConfirm: {
    marginTop: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  pickerConfirmText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  textarea: {
    minHeight: 100,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  attachRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  attachBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
  },
  attachBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  evidenceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  pdfPreview: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pdfName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  removeBtn: {
    padding: 8,
  },
  submitBtn: {
    marginTop: 24,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
