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
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  Add,
  ArrowDown2,
  AttachSquare,
  Calendar1,
  Clock,
  DocumentText,
  InfoCircle,
  Minus,
  Trash,
} from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import {
  BEREAVEMENT_RELATIONSHIP_OPTIONS,
  createPermissionRequest,
  getMyPermissionBalance,
  PERMISSION_CATEGORY_PICKER_OPTIONS,
  uploadPermissionEvidenceFile,
  type BereavementRelationship,
  type PermissionBalanceSnapshot,
  type PermissionCategory,
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
  accentSoft: "#FFF4EB",
  warnBg: "#FFFBEB",
  warnBorder: "#FDE68A",
  warnText: "#B45309",
};

const MAX_EVIDENCE = 5;

const CATEGORY_HINTS: Record<PermissionCategory, string> = {
  ENTRY_UNTIL_NOON: "Chequeo hasta mediodía · 4 h del cupo trimestral",
  HOURLY: "Permiso parcial por horas del cupo trimestral",
  FULL_DAY: "Ausencia de jornada completa",
  SICKNESS: "Sin IMSS · aviso 3 días · justificante",
  PERSONAL_ERRAND: "Trámite personal · 50% salario mín · 1 día/trim.",
  BEREAVEMENT: "Familiar directo · acta · 50% salario mín · 2 días/año",
  VACATION: "Aviso 1 mes · no repetir puesto en mismo almacén",
};

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

function formatQuarterLabel(quarterKey?: string) {
  if (!quarterKey) return "Trimestre actual";
  const match = /^(\d{4})-Q([1-4])$/.exec(quarterKey);
  if (!match) return quarterKey;
  const labels = ["Ene–Mar", "Abr–Jun", "Jul–Sep", "Oct–Dic"];
  return `${labels[Number(match[2]) - 1]} ${match[1]}`;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BalancePill({
  label,
  used,
  remaining,
  unit,
}: {
  label: string;
  used: number;
  remaining: number;
  unit: string;
}) {
  const cap = used + remaining;
  const hasUsage = used > 0;
  return (
    <View style={styles.balancePill}>
      <Text style={styles.balancePillLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.balancePillValue, hasUsage && styles.balancePillValueUsed]}>
        {used}/{cap}
        {unit}
      </Text>
      <Text style={styles.balancePillRest}>{remaining} rest.</Text>
    </View>
  );
}

function Stepper({
  value,
  onChange,
  min = 1,
  max = 14,
  suffix,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  suffix: string;
}) {
  return (
    <View style={styles.stepperRow}>
      <Pressable
        style={[styles.stepperBtn, value <= min && styles.stepperBtnDisabled]}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
      >
        <Minus size={18} color={value <= min ? COLORS.border : COLORS.text} variant="Linear" />
      </Pressable>
      <View style={styles.stepperValueWrap}>
        <Text style={styles.stepperValue}>{value}</Text>
        <Text style={styles.stepperSuffix}>{suffix}</Text>
      </View>
      <Pressable
        style={[styles.stepperBtn, value >= max && styles.stepperBtnDisabled]}
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
      >
        <Add size={18} color={value >= max ? COLORS.border : COLORS.text} variant="Linear" />
      </Pressable>
    </View>
  );
}

export default function NuevoPermisoScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PermissionCategory>("FULL_DAY");
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [requestedHours, setRequestedHours] = useState("2");
  const [requestedDays, setRequestedDays] = useState(1);
  const [includeSundays, setIncludeSundays] = useState(false);
  const [bereavementRelationship, setBereavementRelationship] =
    useState<BereavementRelationship>("PARENT");
  const [balance, setBalance] = useState<PermissionBalanceSnapshot | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [permissionDate, setPermissionDate] = useState(todayStart());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerDraft, setDatePickerDraft] = useState(todayStart());
  const [evidence, setEvidence] = useState<LocalEvidence[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const dateLabel = useMemo(() => localYmd(permissionDate), [permissionDate]);

  const selectedCategoryLabel = useMemo(
    () => PERMISSION_CATEGORY_PICKER_OPTIONS.find((o) => o.value === category)?.label ?? "",
    [category],
  );

  useEffect(() => {
    void getMyPermissionBalance()
      .then(setBalance)
      .catch(() => setBalance(null))
      .finally(() => setBalanceLoading(false));
  }, []);

  const noticeWarning = useMemo(() => {
    const today = todayStart();
    const target = new Date(permissionDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.floor((target.getTime() - today.getTime()) / 86400000);
    if (category === "SICKNESS" && diff < 3) {
      return "La enfermedad requiere aviso con al menos 3 días de anticipación.";
    }
    if (category === "VACATION" && diff < 30) {
      return "Las vacaciones requieren aviso con al menos 30 días de anticipación.";
    }
    return null;
  }, [category, permissionDate]);

  const showDaysField =
    category === "SICKNESS" ||
    category === "FULL_DAY" ||
    category === "PERSONAL_ERRAND" ||
    category === "BEREAVEMENT" ||
    category === "VACATION";

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
    if (noticeWarning) {
      Alert.alert("Aviso insuficiente", noticeWarning);
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
        category,
        requestedHours:
          category === "HOURLY" ? Number(requestedHours.replace(",", ".")) : undefined,
        requestedDays,
        includeSundays: category === "SICKNESS" ? includeSundays : undefined,
        bereavementRelationship:
          category === "BEREAVEMENT" ? bereavementRelationship : undefined,
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
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: Math.max(tabBarHeight, insets.bottom) + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionCard title="Tu saldo">
          {balanceLoading ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 8 }} />
          ) : balance ? (
            <>
              <Text style={styles.quarterHint}>
                {formatQuarterLabel(balance.quarterKey)} · usados / tope
              </Text>
              <View style={styles.balanceGrid}>
                <BalancePill
                  label="Horas"
                  used={balance.hoursUsedQuarter}
                  remaining={balance.hoursRemainingQuarter}
                  unit="h"
                />
                <BalancePill
                  label="Día compl."
                  used={balance.fullDaysUsedQuarter}
                  remaining={balance.fullDaysRemainingQuarter}
                  unit="d"
                />
                <BalancePill
                  label="Enfermedad"
                  used={balance.sicknessDaysUsedQuarter}
                  remaining={balance.sicknessDaysRemainingQuarter}
                  unit="d"
                />
                <BalancePill
                  label="Trámites"
                  used={balance.personalErrandDaysUsedQuarter}
                  remaining={balance.personalErrandDaysRemainingQuarter}
                  unit="d"
                />
              </View>
              <Text style={styles.balanceFootnote}>
                Fallecimiento (año): {balance.bereavementDaysUsedYear}/
                {balance.bereavementDaysUsedYear + balance.bereavementDaysRemainingYear} d ·{" "}
                {balance.bereavementDaysRemainingYear} rest.
              </Text>
            </>
          ) : (
            <Text style={styles.hint}>No se pudo cargar el saldo.</Text>
          )}
        </SectionCard>

        <SectionCard title="Tipo de permiso">
          <Pressable
            style={({ pressed }) => [styles.selectBtn, pressed && styles.selectBtnPressed]}
            onPress={() => setCategoryPickerOpen(true)}
          >
            <View style={styles.selectBtnContent}>
              <Text style={styles.selectValue}>{selectedCategoryLabel}</Text>
              <Text style={styles.selectHint}>{CATEGORY_HINTS[category]}</Text>
            </View>
            <ArrowDown2 size={20} color={COLORS.muted} variant="Linear" />
          </Pressable>
        </SectionCard>

        <SectionCard title="Detalles">
          <Text style={styles.fieldCaption}>Fecha del permiso</Text>
          <Pressable
            style={({ pressed }) => [styles.dateBtn, pressed && styles.dateBtnPressed]}
            onPress={openDatePicker}
          >
            <View style={styles.dateIconWrap}>
              <Calendar1 size={18} color={COLORS.accent} variant="Bold" />
            </View>
            <Text style={styles.dateText}>{formatWorkforceYmd(dateLabel)}</Text>
          </Pressable>

          {category === "HOURLY" ? (
            <>
              <Text style={[styles.fieldCaption, { marginTop: 16 }]}>Horas solicitadas</Text>
              <View style={styles.inputWrap}>
                <Clock size={18} color={COLORS.muted} variant="Linear" />
                <TextInput
                  value={requestedHours}
                  onChangeText={setRequestedHours}
                  keyboardType="decimal-pad"
                  placeholder="Ej. 2"
                  placeholderTextColor={COLORS.muted}
                  style={styles.inputInner}
                />
                <Text style={styles.inputSuffix}>h</Text>
              </View>
            </>
          ) : null}

          {showDaysField ? (
            <>
              <Text style={[styles.fieldCaption, { marginTop: 16 }]}>Días solicitados</Text>
              <Stepper
                value={requestedDays}
                onChange={setRequestedDays}
                max={category === "BEREAVEMENT" ? 2 : 14}
                suffix="días"
              />
            </>
          ) : null}

          {category === "SICKNESS" ? (
            <Pressable
              style={styles.checkboxRow}
              onPress={() => setIncludeSundays((prev) => !prev)}
            >
              <View style={[styles.checkbox, includeSundays && styles.checkboxChecked]}>
                {includeSundays ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <Text style={styles.checkboxLabel}>Incluir domingos en el conteo</Text>
            </Pressable>
          ) : null}

          {category === "BEREAVEMENT" ? (
            <>
              <Text style={[styles.fieldCaption, { marginTop: 16 }]}>Parentesco</Text>
              <View style={styles.relationshipWrap}>
                {BEREAVEMENT_RELATIONSHIP_OPTIONS.map((option) => {
                  const selected = bereavementRelationship === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.relationshipChip,
                        selected && styles.relationshipChipSelected,
                      ]}
                      onPress={() => setBereavementRelationship(option.value)}
                    >
                      <Text
                        style={[
                          styles.relationshipChipText,
                          selected && styles.relationshipChipTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          {noticeWarning ? (
            <View style={styles.warningBanner}>
              <InfoCircle size={18} color={COLORS.warnText} variant="Bold" />
              <Text style={styles.warningText}>{noticeWarning}</Text>
            </View>
          ) : null}
        </SectionCard>

        <SectionCard title="Motivo">
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe el motivo del permiso…"
            placeholderTextColor={COLORS.muted}
            multiline
            numberOfLines={4}
            style={styles.textarea}
            textAlignVertical="top"
          />
        </SectionCard>

        <SectionCard title="Evidencias">
          <Text style={styles.hint}>Imagen o PDF · máximo {MAX_EVIDENCE} archivos</Text>
          <View style={styles.attachRow}>
            <Pressable
              style={({ pressed }) => [styles.attachBtn, pressed && styles.attachBtnPressed]}
              onPress={() => void addImage()}
            >
              <AttachSquare size={20} color={COLORS.accent} variant="Linear" />
              <Text style={styles.attachBtnText}>Foto</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.attachBtn, pressed && styles.attachBtnPressed]}
              onPress={() => void addPdf()}
            >
              <DocumentText size={20} color={COLORS.accent} variant="Linear" />
              <Text style={styles.attachBtnText}>PDF</Text>
            </Pressable>
          </View>

          {evidence.length > 0 ? (
            <View style={styles.evidenceList}>
              {evidence.map((item) => (
                <View key={item.id} style={styles.evidenceCard}>
                  {item.isPdf ? (
                    <View style={styles.pdfPreview}>
                      <DocumentText size={24} color={COLORS.accent} variant="Bold" />
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
                    hitSlop={8}
                  >
                    <Trash size={18} color="#DC2626" variant="Linear" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.evidenceEmpty}>
              <AttachSquare size={28} color={COLORS.border} variant="Linear" />
              <Text style={styles.evidenceEmptyText}>Sin archivos adjuntos</Text>
            </View>
          )}
        </SectionCard>

        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            submitting && styles.submitDisabled,
            pressed && !submitting && styles.submitBtnPressed,
          ]}
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
        visible={categoryPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryPickerOpen(false)}
      >
        <View style={styles.pickerOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCategoryPickerOpen(false)}
          />
          <View style={[styles.pickerCard, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Tipo de permiso</Text>
            <ScrollView style={styles.categoryList} keyboardShouldPersistTaps="handled">
              {PERMISSION_CATEGORY_PICKER_OPTIONS.map((option) => {
                const selected = option.value === category;
                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.categoryOption,
                      selected && styles.categoryOptionSelected,
                    ]}
                    onPress={() => {
                      setCategory(option.value);
                      setCategoryPickerOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryOptionLabel,
                        selected && styles.categoryOptionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.categoryOptionHint}>
                      {CATEGORY_HINTS[option.value]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
            <View style={styles.pickerHandle} />
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
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  quarterHint: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 10,
  },
  balanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  balancePill: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  balancePillLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: 4,
  },
  balancePillValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  balancePillValueUsed: {
    color: COLORS.accent,
  },
  balancePillRest: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  balanceFootnote: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 10,
  },
  hint: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 8,
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectBtnPressed: { opacity: 0.85 },
  selectBtnContent: { flex: 1 },
  selectValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  selectHint: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 16,
  },
  fieldCaption: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateBtnPressed: { opacity: 0.85 },
  dateIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputInner: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    paddingVertical: 10,
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.muted,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepperBtnDisabled: { opacity: 0.4 },
  stepperValueWrap: {
    alignItems: "center",
  },
  stepperValue: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  stepperSuffix: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  checkMark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  relationshipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  relationshipChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  relationshipChipSelected: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accent,
  },
  relationshipChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  relationshipChipTextSelected: {
    color: COLORS.accent,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.warnBg,
    borderWidth: 1,
    borderColor: COLORS.warnBorder,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warnText,
    fontWeight: "600",
    lineHeight: 18,
  },
  textarea: {
    minHeight: 96,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
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
    backgroundColor: COLORS.accentSoft,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  attachBtnPressed: { opacity: 0.85 },
  attachBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accent,
  },
  evidenceList: { gap: 8 },
  evidenceEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  evidenceEmptyText: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 8,
  },
  evidenceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumb: {
    width: 52,
    height: 52,
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
    fontWeight: "500",
  },
  removeBtn: {
    padding: 8,
  },
  submitBtn: {
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnPressed: { opacity: 0.9 },
  submitDisabled: { opacity: 0.7 },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
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
    paddingTop: 8,
    paddingHorizontal: 16,
    maxHeight: "75%",
  },
  pickerHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 12,
  },
  categoryList: {
    maxHeight: 420,
  },
  categoryOption: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryOptionSelected: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accent,
  },
  categoryOptionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  categoryOptionLabelSelected: {
    color: COLORS.accent,
  },
  categoryOptionHint: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 16,
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
});
