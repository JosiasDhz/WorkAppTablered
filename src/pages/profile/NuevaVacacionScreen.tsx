import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  Add,
  Calendar1,
  DocumentText,
  Gallery,
  InfoCircle,
  Minus,
  Trash,
} from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { PageFlipReveal } from "../../components/PageFlipReveal";
import { SoftPressable } from "../../components/SoftPressable";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { SCREEN_GUTTER } from "../../theme/layout";
import {
  createVacationRequest,
  getMyVacationBalance,
  uploadPermissionEvidenceFile,
  type VacationBalanceDto,
} from "../../services/workforceVacationsService";
import { prepareEvidenceImageForUpload } from "../../utils/prepareEvidenceImageForUpload";
import { formatWorkforceYmd } from "../../utils/formatWorkforceYmd";

const COLORS = {
  surface: "#FFFFFF",
  ink: "#1C1C1E",
  muted: "#8E8E93",
  field: "#F3F1EC",
  fieldFocus: "#FFFFFF",
  accent: "#EA7600",
  accentSoft: "rgba(234, 118, 0, 0.14)",
  warnBg: "#FFFBEB",
  warnText: "#B45309",
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

function calendarDaysUntilDate(target: Date) {
  const today = todayStart();
  const end = new Date(target);
  end.setHours(0, 0, 0, 0);
  const ms = end.getTime() - today.getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function NuevaVacacionScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();

  const [description, setDescription] = useState("");
  const [requestedDays, setRequestedDays] = useState(1);
  const [permissionDate, setPermissionDate] = useState(todayStart());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerDraft, setDatePickerDraft] = useState(todayStart());
  const [evidence, setEvidence] = useState<LocalEvidence[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [motivoFocused, setMotivoFocused] = useState(false);
  const [balance, setBalance] = useState<VacationBalanceDto | null>(null);

  const dateLabel = useMemo(() => localYmd(permissionDate), [permissionDate]);

  useEffect(() => {
    void getMyVacationBalance(dateLabel)
      .then(setBalance)
      .catch(() => setBalance(null));
  }, [dateLabel]);

  const noticeDays = balance?.noticeDays ?? 30;
  const periodMin = balance?.periodMinDays ?? 1;
  const periodMax = balance?.periodMaxDays ?? 32;

  const noticeWarning = useMemo(() => {
    if (calendarDaysUntilDate(permissionDate) < noticeDays) {
      return `Las vacaciones requieren aviso con al menos ${noticeDays} días de anticipación.`;
    }
    return null;
  }, [permissionDate, noticeDays]);

  useEffect(() => {
    if (requestedDays < periodMin) setRequestedDays(periodMin);
    if (requestedDays > periodMax) setRequestedDays(periodMax);
  }, [periodMin, periodMax, requestedDays]);

  const addPhoto = async () => {
    if (evidence.length >= MAX_EVIDENCE) {
      Alert.alert("Límite", `Máximo ${MAX_EVIDENCE} archivos de evidencia`);
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Autoriza el acceso a tu galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    try {
      const prepared = await prepareEvidenceImageForUpload(result.assets[0]);
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

  const submit = async () => {
    const desc = description.trim();
    if (!desc) {
      Alert.alert(
        "Motivo requerido",
        "Escribe el motivo y quién cubre tu lugar durante el periodo.",
      );
      return;
    }
    if (evidence.length === 0) {
      Alert.alert("Evidencia requerida", "Adjunta al menos una imagen o PDF.");
      return;
    }
    if (noticeWarning) {
      Alert.alert("Aviso insuficiente", noticeWarning);
      return;
    }
    if (balance && !balance.eligible) {
      Alert.alert(
        "No elegible",
        balance.hireDate
          ? `Requieres al menos ${balance.minServiceYears} año(s) de servicio.`
          : "Falta tu fecha de ingreso. Pide a RH que la registre.",
      );
      return;
    }
    if (balance && requestedDays > balance.daysRemaining) {
      Alert.alert(
        "Saldo insuficiente",
        `Solo te quedan ${balance.daysRemaining} día(s) de vacaciones.`,
      );
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
      await createVacationRequest({
        description: desc,
        permissionDate: dateLabel,
        requestedDays,
        fileIds,
      });
      Alert.alert(
        "Solicitud enviada",
        "Tu solicitud de vacaciones quedó pendiente de preautorización de RH.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("MisVacaciones"),
          },
        ],
      );
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ||
        "No se pudo enviar la solicitud";
      Alert.alert("Error", String(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <HeaderTitle
          title="Solicitar vacaciones"
          subtitle="Periodo, saldo y evidencias"
          tone="light"
          style={styles.header}
          onBack={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
        />
        <KeyboardAwareScrollView
          style={styles.scroll}
          onScroll={onAutoTabBarScroll}
          scrollEventThrottle={16}
          enableOnAndroid
          extraScrollHeight={24}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: SCREEN_GUTTER,
            paddingTop: 8,
            paddingBottom: Math.max(tabBarHeight, insets.bottom) + 36,
            gap: 14,
          }}
        >
          <PageFlipReveal delay={0} active={isFocused}>
            <SectionCard title="Saldo">
              {balance ? (
                <Text style={styles.helperText}>
                  {balance.eligible
                    ? `Restan ${balance.daysRemaining} de ${balance.annualDays} días · ${balance.periodHint ?? "periodo según antigüedad"}`
                    : balance.hireDate
                      ? `Aún no cumples ${balance.minServiceYears} año(s) de servicio`
                      : "Sin fecha de ingreso registrada"}
                </Text>
              ) : (
                <Text style={styles.helperText}>Cargando saldo…</Text>
              )}
            </SectionCard>
          </PageFlipReveal>

          <PageFlipReveal delay={70} active={isFocused}>
            <SectionCard title="Periodo">
              <Text style={styles.fieldCaption}>Fecha de inicio</Text>
              <SoftPressable
                onPress={() => {
                  setDatePickerDraft(permissionDate);
                  setDatePickerOpen(true);
                }}
                scaleTo={0.99}
              >
                <View style={styles.softShell}>
                  <View style={styles.softIcon}>
                    <Calendar1 size={18} color={COLORS.accent} variant="Linear" />
                  </View>
                  <Text style={styles.dateText}>
                    {formatWorkforceYmd(dateLabel)}
                  </Text>
                </View>
              </SoftPressable>

              <Text style={[styles.fieldCaption, { marginTop: 16 }]}>
                Días solicitados
              </Text>
              <View style={styles.stepper}>
                <SoftPressable
                  onPress={() =>
                    setRequestedDays((v) => Math.max(periodMin, v - 1))
                  }
                  scaleTo={0.94}
                  style={styles.stepBtn}
                >
                  <Minus size={18} color={COLORS.ink} variant="Linear" />
                </SoftPressable>
                <Text style={styles.stepValue}>{requestedDays}</Text>
                <SoftPressable
                  onPress={() =>
                    setRequestedDays((v) => Math.min(periodMax, v + 1))
                  }
                  scaleTo={0.94}
                  style={styles.stepBtn}
                >
                  <Add size={18} color={COLORS.ink} variant="Linear" />
                </SoftPressable>
              </View>
              <Text style={styles.helperText}>
                Permitido: {periodMin}
                {periodMin === periodMax ? "" : `–${periodMax}`} día(s) por periodo
              </Text>

              {noticeWarning ? (
                <View style={styles.warnBox}>
                  <InfoCircle size={16} color={COLORS.warnText} variant="Bold" />
                  <Text style={styles.warnText}>{noticeWarning}</Text>
                </View>
              ) : null}
            </SectionCard>
          </PageFlipReveal>

          <PageFlipReveal delay={140} active={isFocused}>
            <SectionCard title="Motivo">
              <View
                style={[
                  styles.fieldShell,
                  styles.motivoShell,
                  motivoFocused && styles.fieldShellFocused,
                ]}
              >
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  onFocus={() => setMotivoFocused(true)}
                  onBlur={() => setMotivoFocused(false)}
                  multiline
                  placeholder="Motivo, pendientes y quién cubre tu lugar…"
                  placeholderTextColor="rgba(105, 97, 88, 0.55)"
                  style={styles.motivoInput}
                />
              </View>
            </SectionCard>
          </PageFlipReveal>

          <PageFlipReveal delay={210} active={isFocused}>
            <SectionCard title="Evidencia">
              <View style={styles.evidenceActions}>
                <SoftPressable onPress={addPhoto} scaleTo={0.97} style={styles.evidenceBtn}>
                  <Gallery size={18} color={COLORS.accent} variant="Linear" />
                  <Text style={styles.evidenceBtnText}>Foto</Text>
                </SoftPressable>
                <SoftPressable onPress={addPdf} scaleTo={0.97} style={styles.evidenceBtn}>
                  <DocumentText size={18} color={COLORS.accent} variant="Linear" />
                  <Text style={styles.evidenceBtnText}>PDF</Text>
                </SoftPressable>
              </View>
              {evidence.map((item) => (
                <View key={item.id} style={styles.evidenceRow}>
                  {item.isPdf ? (
                    <DocumentText size={20} color={COLORS.muted} variant="Linear" />
                  ) : (
                    <Image source={{ uri: item.uri }} style={styles.thumb} />
                  )}
                  <Text style={styles.evidenceName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Pressable onPress={() => setEvidence((prev) => prev.filter((e) => e.id !== item.id))}>
                    <Trash size={18} color="#BE123C" variant="Linear" />
                  </Pressable>
                </View>
              ))}
            </SectionCard>
          </PageFlipReveal>

          <SoftPressable
            onPress={() => void submit()}
            disabled={submitting}
            scaleTo={0.98}
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Enviar solicitud</Text>
            )}
          </SoftPressable>
        </KeyboardAwareScrollView>
      </SafeAreaView>

      {datePickerOpen && Platform.OS === "android" ? (
        <DateTimePicker
          value={datePickerDraft}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            setDatePickerOpen(false);
            if (event.type === "dismissed" || !selected) return;
            selected.setHours(0, 0, 0, 0);
            setPermissionDate(selected);
          }}
        />
      ) : null}

      {datePickerOpen && Platform.OS === "ios" ? (
        <Modal transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <DateTimePicker
                value={datePickerDraft}
                mode="date"
                display="spinner"
                onChange={(_, selected) => {
                  if (selected) {
                    selected.setHours(0, 0, 0, 0);
                    setDatePickerDraft(selected);
                  }
                }}
              />
              <View style={styles.modalActions}>
                <Pressable onPress={() => setDatePickerOpen(false)}>
                  <Text style={styles.modalCancel}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setPermissionDate(datePickerDraft);
                    setDatePickerOpen(false);
                  }}
                >
                  <Text style={styles.modalOk}>Listo</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F2F7" },
  safe: { flex: 1 },
  header: { paddingHorizontal: SCREEN_GUTTER },
  scroll: { flex: 1 },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.muted,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  fieldCaption: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.ink,
    marginBottom: 8,
  },
  helperText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
    lineHeight: 18,
  },
  softShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.field,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  softIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.field,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: {
    minWidth: 36,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.ink,
  },
  warnBox: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: COLORS.warnBg,
    borderRadius: 12,
    padding: 10,
  },
  warnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.warnText,
    lineHeight: 18,
  },
  fieldShell: {
    backgroundColor: COLORS.field,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  fieldShellFocused: {
    backgroundColor: COLORS.fieldFocus,
    borderColor: "rgba(234, 118, 0, 0.35)",
  },
  motivoShell: { minHeight: 110, padding: 12 },
  motivoInput: {
    flex: 1,
    minHeight: 90,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.ink,
    textAlignVertical: "top",
  },
  evidenceActions: { flexDirection: "row", gap: 10 },
  evidenceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.field,
    borderRadius: 14,
    paddingVertical: 12,
  },
  evidenceBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.ink },
  evidenceRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  thumb: { width: 36, height: 36, borderRadius: 8 },
  evidenceName: { flex: 1, fontSize: 13, fontWeight: "500", color: COLORS.muted },
  submitBtn: {
    marginTop: 4,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modalCancel: { fontSize: 16, fontWeight: "600", color: COLORS.muted },
  modalOk: { fontSize: 16, fontWeight: "700", color: COLORS.accent },
});
