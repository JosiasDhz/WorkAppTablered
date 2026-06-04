import React, { useEffect, useMemo, useState } from "react";
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
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { ArrowDown2, AttachSquare, Calendar1, DocumentText, Trash } from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import {
  createIncapacityRequest,
  listIncapacityReasons,
  uploadIncapacityEvidenceFile,
  type IncapacityReasonDto,
} from "../../services/workforceIncapacityRequestService";
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

type DatePickerField = "start" | "end";

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

function inclusiveDays(startYmd: string, endYmd: string) {
  const s = new Date(`${startYmd}T12:00:00`);
  const e = new Date(`${endYmd}T12:00:00`);
  return Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
}

export default function NuevaIncapacidadScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [reasons, setReasons] = useState<IncapacityReasonDto[]>([]);
  const [loadingReasons, setLoadingReasons] = useState(true);
  const [selectedReasonId, setSelectedReasonId] = useState<string | null>(null);
  const [reasonPickerOpen, setReasonPickerOpen] = useState(false);
  const [startDate, setStartDate] = useState(todayStart());
  const [endDate, setEndDate] = useState(todayStart());
  const [datePickerField, setDatePickerField] = useState<DatePickerField | null>(null);
  const [datePickerDraft, setDatePickerDraft] = useState(todayStart());
  const [evidence, setEvidence] = useState<LocalEvidence[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedReason = useMemo(
    () => reasons.find((r) => r.id === selectedReasonId) ?? null,
    [reasons, selectedReasonId],
  );

  const startLabel = useMemo(() => localYmd(startDate), [startDate]);
  const endLabel = useMemo(() => localYmd(endDate), [endDate]);
  const dayCount = useMemo(
    () => (endLabel >= startLabel ? inclusiveDays(startLabel, endLabel) : 0),
    [startLabel, endLabel],
  );

  const datePickerTitle =
    datePickerField === "start" ? "Fecha de inicio" : "Fecha de fin";

  useEffect(() => {
    void listIncapacityReasons()
      .then(setReasons)
      .catch(() => setReasons([]))
      .finally(() => setLoadingReasons(false));
  }, []);

  useEffect(() => {
    if (endDate < startDate) setEndDate(startDate);
  }, [startDate, endDate]);

  const openDatePicker = (field: DatePickerField) => {
    setDatePickerDraft(field === "start" ? startDate : endDate);
    setDatePickerField(field);
  };

  const closeDatePicker = () => setDatePickerField(null);

  const confirmDatePicker = () => {
    if (datePickerField === "start") {
      setStartDate(datePickerDraft);
      if (datePickerDraft > endDate) setEndDate(datePickerDraft);
    } else if (datePickerField === "end") {
      setEndDate(datePickerDraft < startDate ? startDate : datePickerDraft);
    }
    closeDatePicker();
  };

  const onAndroidDateChange = (event: { type: string }, selected?: Date) => {
    if (event.type === "dismissed") {
      closeDatePicker();
      return;
    }
    if (!selected || !datePickerField) return;
    if (datePickerField === "start") {
      setStartDate(selected);
      if (selected > endDate) setEndDate(selected);
    } else {
      setEndDate(selected < startDate ? startDate : selected);
    }
    closeDatePicker();
  };

  const selectReason = (reason: IncapacityReasonDto) => {
    setSelectedReasonId(reason.id);
    setReasonPickerOpen(false);
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
        "Intenta con otra foto o exporta la imagen como JPG.",
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
    if (!selectedReason) {
      Alert.alert("Motivo requerido", "Selecciona el motivo de la incapacidad.");
      return;
    }
    if (endLabel < startLabel) {
      Alert.alert("Rango inválido", "La fecha de fin no puede ser anterior al inicio.");
      return;
    }
    if (dayCount > selectedReason.maxDays) {
      Alert.alert(
        "Rango muy largo",
        `Este motivo permite máximo ${selectedReason.maxDays} día(s); seleccionaste ${dayCount}.`,
      );
      return;
    }
    if (selectedReason.requiresEvidence && evidence.length === 0) {
      Alert.alert("Evidencia requerida", "Adjunta al menos una imagen o PDF.");
      return;
    }

    setSubmitting(true);
    try {
      const fileIds: string[] = [];
      for (const item of evidence) {
        const uploaded = await uploadIncapacityEvidenceFile({
          uri: item.uri,
          name: item.name,
          mimeType: item.mimeType,
        });
        if (uploaded?.id) fileIds.push(uploaded.id);
      }
      await createIncapacityRequest({
        reasonId: selectedReason.id,
        startDate: startLabel,
        endDate: endLabel,
        fileIds: fileIds.length > 0 ? fileIds : undefined,
      });
      Alert.alert("Solicitud enviada", "Tu incapacidad quedó pendiente de revisión.", [
        {
          text: "OK",
          onPress: () => navigation.navigate("MisIncapacidades"),
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
      <HeaderTitle title="Solicitar incapacidad" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(tabBarHeight, insets.bottom) + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Motivo de incidencia</Text>
        {loadingReasons ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 12 }} />
        ) : reasons.length === 0 ? (
          <Text style={styles.hint}>No hay motivos disponibles.</Text>
        ) : (
          <Pressable
            style={styles.selectBtn}
            onPress={() => setReasonPickerOpen(true)}
          >
            <Text
              style={selectedReason ? styles.selectValue : styles.selectPlaceholder}
              numberOfLines={2}
            >
              {selectedReason
                ? selectedReason.name
                : "Selecciona un motivo…"}
            </Text>
            <ArrowDown2 size={20} color={COLORS.muted} variant="Linear" />
          </Pressable>
        )}
        {selectedReason ? (
          <Text style={styles.hint}>
            Máx. {selectedReason.maxDays} día(s)
            {selectedReason.requiresEvidence ? " · Requiere evidencia" : " · Sin evidencia"}
          </Text>
        ) : null}

        <Text style={[styles.label, { marginTop: 20 }]}>Rango de fechas</Text>
        <Text style={styles.fieldCaption}>Fecha de inicio</Text>
        <Pressable style={styles.dateBtn} onPress={() => openDatePicker("start")}>
          <Calendar1 size={18} color={COLORS.accent} variant="Linear" />
          <Text style={styles.dateText}>{formatWorkforceYmd(localYmd(startDate))}</Text>
        </Pressable>
        <Text style={[styles.fieldCaption, { marginTop: 10 }]}>Fecha de fin</Text>
        <Pressable style={styles.dateBtn} onPress={() => openDatePicker("end")}>
          <Calendar1 size={18} color={COLORS.accent} variant="Linear" />
          <Text style={styles.dateText}>{formatWorkforceYmd(localYmd(endDate))}</Text>
        </Pressable>
        {dayCount > 0 ? (
          <Text style={styles.hint}>
            {dayCount} día(s) seleccionado(s)
            {selectedReason ? ` · máximo ${selectedReason.maxDays}` : ""}
          </Text>
        ) : null}

        {selectedReason?.requiresEvidence ? (
          <>
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
          </>
        ) : null}

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

      <Modal
        visible={reasonPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReasonPickerOpen(false)}
      >
        <View style={styles.pickerOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setReasonPickerOpen(false)}
          />
          <View style={[styles.pickerCard, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <Text style={styles.pickerTitle}>Motivo de incidencia</Text>
            <ScrollView style={styles.reasonList} keyboardShouldPersistTaps="handled">
              {reasons.map((reason) => {
                const selected = reason.id === selectedReasonId;
                return (
                  <Pressable
                    key={reason.id}
                    style={[styles.reasonOption, selected && styles.reasonOptionSelected]}
                    onPress={() => selectReason(reason)}
                  >
                    <Text style={styles.reasonOptionName}>{reason.name}</Text>
                    <Text style={styles.reasonOptionMeta}>
                      Máx. {reason.maxDays} día(s)
                      {reason.requiresEvidence ? " · Requiere evidencia" : " · Sin evidencia"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {Platform.OS === "android" && datePickerField ? (
        <DateTimePicker
          value={datePickerField === "start" ? startDate : endDate}
          mode="date"
          display="default"
          locale="es-MX"
          minimumDate={datePickerField === "end" ? startDate : todayStart()}
          onChange={onAndroidDateChange}
        />
      ) : null}

      <Modal
        visible={Boolean(datePickerField) && Platform.OS === "ios"}
        transparent
        animationType="fade"
        onRequestClose={closeDatePicker}
      >
        <View style={styles.pickerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDatePicker} />
          <View style={[styles.pickerCard, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <Text style={styles.pickerTitle}>{datePickerTitle}</Text>
            <DateTimePicker
              value={datePickerDraft}
              mode="date"
              display="spinner"
              locale="es-MX"
              minimumDate={datePickerField === "end" ? startDate : todayStart()}
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
  fieldCaption: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 10,
    marginTop: 4,
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  selectPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: COLORS.muted,
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
  reasonList: {
    maxHeight: 320,
  },
  reasonOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  reasonOptionSelected: {
    borderColor: COLORS.accent,
    backgroundColor: "#FFF8F0",
  },
  reasonOptionName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  reasonOptionMeta: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
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
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
  },
  attachBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.accent,
  },
  evidenceCard: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  thumb: {
    width: "100%",
    height: 160,
    backgroundColor: "#E5E7EB",
  },
  pdfPreview: {
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  pdfName: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: "center",
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 6,
  },
  submitBtn: {
    marginTop: 24,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.7 },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
