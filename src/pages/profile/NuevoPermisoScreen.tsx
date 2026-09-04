import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
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
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  Add,
  ArrowDown2,
  Calendar1,
  ClipboardTick,
  Clock,
  DocumentText,
  Gallery,
  Heart,
  Hospital,
  InfoCircle,
  Minus,
  TickCircle,
  Trash,
  User,
} from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { PageFlipReveal } from "../../components/PageFlipReveal";
import { SoftPressable } from "../../components/SoftPressable";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { useAppAppearance } from "../../theme/appearance";
import { useFormColors, type FormColors } from "../../theme/formColors";
import { SCREEN_GUTTER } from "../../theme/layout";
import {
  createPermissionRequest,
  PERMISSION_CATEGORY_GROUPS,
  PERMISSION_CATEGORY_PICKER_OPTIONS,
  uploadPermissionEvidenceFile,
  type PermissionCategory,
} from "../../services/workforcePermissionRequestService";
import { prepareEvidenceImageForUpload } from "../../utils/prepareEvidenceImageForUpload";
import { formatWorkforceYmd } from "../../utils/formatWorkforceYmd";

type Styles = ReturnType<typeof createStyles>;

const FLIP_STAGGER_MS = 70;

const MAX_EVIDENCE = 5;

const CATEGORY_HINTS: Record<PermissionCategory, string> = {
  ENTRY_UNTIL_NOON: "Ya no disponible",
  HOURLY: "Ya no disponible",
  FULL_DAY: "Ya no disponible",
  SICKNESS:
    "Aviso el primer día al jefe · 2 días/trim. Dengue/COVID: 60%, 6 días/año. Alcoholismo no aplica.",
  PERSONAL: "1 día cada 3 meses",
  PERSONAL_ERRAND:
    "Propio o hijo menor de 18 · 1 día (10.5 h) / 6 meses · máx. 2 h o jornada completa · aviso 3 días hábiles",
  BEREAVEMENT: "Padres, hermanos, pareja o hijos · 4 días/año",
  VACATION: "Usa el módulo Mis vacaciones",
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

function CategoryIcon({
  category,
  color,
  size = 18,
}: {
  category: PermissionCategory;
  color: string;
  size?: number;
}) {
  const props = { size, color, variant: "Linear" as const };
  if (category === "SICKNESS") return <Hospital {...props} />;
  if (category === "BEREAVEMENT") return <Heart {...props} />;
  if (category === "PERSONAL") return <User {...props} />;
  if (category === "PERSONAL_ERRAND") return <ClipboardTick {...props} />;
  return <Calendar1 {...props} />;
}

function SoftCheckbox({
  checked,
  label,
  onPress,
  styles,
  COLORS,
}: {
  checked: boolean;
  label: string;
  onPress: () => void;
  styles: Styles;
  COLORS: FormColors;
}) {
  return (
    <Pressable style={styles.checkboxRow} onPress={onPress}>
      {checked ? (
        <TickCircle size={22} color={COLORS.accent} variant="Bold" />
      ) : (
        <View style={styles.checkbox} />
      )}
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

function SectionCard({
  title,
  children,
  styles,
}: {
  title: string;
  children: React.ReactNode;
  styles: Styles;
}) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Stepper({
  value,
  onChange,
  min = 1,
  max = 14,
  suffix,
  styles,
  COLORS,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  suffix: string;
  styles: Styles;
  COLORS: FormColors;
}) {
  return (
    <View style={styles.stepperRow}>
      <Pressable
        style={[styles.stepperBtn, value <= min && styles.stepperBtnDisabled]}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
      >
        <Minus size={18} color={value <= min ? COLORS.muted : COLORS.ink} variant="Linear" />
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
        <Add size={18} color={value >= max ? COLORS.muted : COLORS.ink} variant="Linear" />
      </Pressable>
    </View>
  );
}

function workingDaysUntilDate(target: Date) {
  const today = todayStart();
  const end = new Date(target);
  end.setHours(0, 0, 0, 0);
  if (end <= today) return 0;
  let count = 0;
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= end) {
    if (cursor.getDay() !== 0) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export default function NuevoPermisoScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const COLORS = useFormColors();
  const { scheme } = useAppAppearance();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PermissionCategory>("PERSONAL");
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const categoryOverlayOpacity = useRef(new Animated.Value(0)).current;
  const categorySheetY = useRef(new Animated.Value(420)).current;
  const categoryCloseAnim = useRef<Animated.CompositeAnimation | null>(null);

  const openCategoryPicker = () => {
    categoryCloseAnim.current?.stop();
    categoryOverlayOpacity.setValue(0);
    categorySheetY.setValue(420);
    setCategoryPickerVisible(true);
  };

  const closeCategoryPicker = () => {
    if (!categoryPickerVisible) return;
    categoryCloseAnim.current?.stop();
    categoryCloseAnim.current = Animated.parallel([
      Animated.timing(categoryOverlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(categorySheetY, {
        toValue: 420,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    categoryCloseAnim.current.start(({ finished }) => {
      if (finished) setCategoryPickerVisible(false);
    });
  };

  useEffect(() => {
    if (!categoryPickerVisible) return;
    const openAnim = Animated.parallel([
      Animated.timing(categoryOverlayOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(categorySheetY, {
        toValue: 0,
        friction: 8,
        tension: 68,
        useNativeDriver: true,
      }),
    ]);
    openAnim.start();
    return () => openAnim.stop();
  }, [categoryPickerVisible, categoryOverlayOpacity, categorySheetY]);
  const [requestedHours, setRequestedHours] = useState("");
  const [requestedDays, setRequestedDays] = useState(1);
  const [isDengueCovid, setIsDengueCovid] = useState(false);
  const [hasAntibioticPrescription, setHasAntibioticPrescription] = useState(false);
  const [restDaysSpecified, setRestDaysSpecified] = useState(false);
  const [permissionDate, setPermissionDate] = useState(todayStart());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerDraft, setDatePickerDraft] = useState(todayStart());
  const [evidence, setEvidence] = useState<LocalEvidence[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [hoursFocused, setHoursFocused] = useState(false);
  const [motivoFocused, setMotivoFocused] = useState(false);

  const dateLabel = useMemo(() => localYmd(permissionDate), [permissionDate]);

  const selectedCategory = useMemo(
    () => PERMISSION_CATEGORY_PICKER_OPTIONS.find((o) => o.value === category) ?? null,
    [category],
  );
  const selectedCategoryLabel = selectedCategory?.label ?? "";

  const noticeWarning = useMemo(() => {
    if (category === "PERSONAL_ERRAND" && workingDaysUntilDate(permissionDate) < 3) {
      return "Los trámites requieren aviso con al menos 3 días hábiles de anticipación.";
    }
    return null;
  }, [category, permissionDate]);

  const showDaysField =
    category === "BEREAVEMENT" ||
    (category === "SICKNESS" && restDaysSpecified);

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
      Alert.alert(
        "Motivo requerido",
        "Escribe el motivo, pendientes y quién cubre tu lugar.",
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
          category === "PERSONAL_ERRAND" && requestedHours.trim()
            ? Number(requestedHours.replace(",", "."))
            : undefined,
        requestedDays,
        isDengueCovid: category === "SICKNESS" ? isDengueCovid : undefined,
        hasAntibioticPrescription:
          category === "SICKNESS" ? hasAntibioticPrescription : undefined,
        restDaysSpecified: category === "SICKNESS" ? restDaysSpecified : undefined,
        fileIds,
      });
      Alert.alert(
        "Solicitud enviada",
        category === "SICKNESS"
          ? "Tu permiso quedó pendiente de autorización del jefe."
          : "Tu permiso quedó pendiente de preautorización de RH.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("MisPermisos"),
          },
        ],
      );
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || "No se pudo enviar la solicitud";
      Alert.alert("Error", String(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <HeaderTitle
          title="Solicitar permiso"
          subtitle="Completa los datos de tu solicitud"
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
          extraScrollHeight={48}
          enableResetScrollToCoords={false}
          keyboardShouldPersistTaps="handled"
          keyboardOpeningTime={0}
          contentContainerStyle={{
            paddingHorizontal: SCREEN_GUTTER,
            paddingTop: 8,
            paddingBottom: Math.max(tabBarHeight, insets.bottom) + 36,
          }}
          showsVerticalScrollIndicator={false}
        >
          <PageFlipReveal delay={0} active={isFocused}>
            <SectionCard title="Tipo de permiso" styles={styles}>
              <SoftPressable
                onPress={openCategoryPicker}
                scaleTo={0.99}
                accessibilityLabel="Tipo de permiso"
              >
                <View style={styles.softShell}>
                  <View style={styles.softIcon}>
                    <CategoryIcon category={category} color={COLORS.accent} />
                  </View>
                  <View style={styles.selectBtnContent}>
                    <View style={styles.selectTitleRow}>
                      <Text style={styles.selectValue}>{selectedCategoryLabel}</Text>
                      {selectedCategory ? (
                        <View style={styles.payChip}>
                          <Text style={styles.payChipText}>{selectedCategory.payLabel}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <ArrowDown2 size={16} color={COLORS.muted} variant="Linear" />
                </View>
              </SoftPressable>
              <Text style={styles.helperText}>{CATEGORY_HINTS[category]}</Text>
            </SectionCard>
          </PageFlipReveal>

          <SectionCard title="Detalles" styles={styles}>
          <Text style={styles.fieldCaption}>Fecha del permiso</Text>
          <SoftPressable
            onPress={openDatePicker}
            scaleTo={0.99}
            accessibilityLabel="Fecha del permiso"
          >
            <View style={styles.softShell}>
              <View style={styles.softIcon}>
                <Calendar1 size={18} color={COLORS.accent} variant="Linear" />
              </View>
              <Text style={styles.dateText}>{formatWorkforceYmd(dateLabel)}</Text>
            </View>
          </SoftPressable>

          {category === "PERSONAL_ERRAND" ? (
            <>
              <Text style={[styles.fieldCaption, { marginTop: 16 }]}>Horas (opcional)</Text>
              <View style={[styles.fieldShell, hoursFocused && styles.fieldShellFocused]}>
                <Clock
                  size={22}
                  color={hoursFocused ? COLORS.accent : COLORS.muted}
                  variant="Bold"
                />
                <TextInput
                  value={requestedHours}
                  onChangeText={setRequestedHours}
                  onFocus={() => setHoursFocused(true)}
                  onBlur={() => setHoursFocused(false)}
                  keyboardType="decimal-pad"
                  placeholder="Máx. 2"
                  placeholderTextColor={COLORS.muted}
                  style={styles.fieldInput}
                />
                <Text style={styles.inputSuffix}>h</Text>
              </View>
              <Text style={styles.helperText}>
                Si dejas vacío o pides más de 2 h, cuenta como jornada completa.
              </Text>
            </>
          ) : null}

          {category === "SICKNESS" ? (
            <>
              <SoftCheckbox
                checked={isDengueCovid}
                onPress={() => setIsDengueCovid((v) => !v)}
                label="Es dengue o COVID (estudio de laboratorio)"
                styles={styles}
                COLORS={COLORS}
              />
              <SoftCheckbox
                checked={hasAntibioticPrescription}
                onPress={() => setHasAntibioticPrescription((v) => !v)}
                label="El certificado receta antibiótico y tiempo de descanso"
                styles={styles}
                COLORS={COLORS}
              />
              <SoftCheckbox
                checked={restDaysSpecified}
                onPress={() => setRestDaysSpecified((v) => !v)}
                label="El justificante indica cuántos días de descanso"
                styles={styles}
                COLORS={COLORS}
              />
            </>
          ) : null}

          {showDaysField ? (
            <>
              <Text style={[styles.fieldCaption, { marginTop: 16 }]}>Días solicitados</Text>
              <Stepper
                value={requestedDays}
                onChange={setRequestedDays}
                max={
                  category === "BEREAVEMENT"
                    ? 4
                    : category === "SICKNESS"
                      ? 6
                      : 14
                }
                suffix="días"
                styles={styles}
                COLORS={COLORS}
              />
            </>
          ) : null}

          {noticeWarning ? (
            <View style={styles.warningBanner}>
              <InfoCircle size={18} color={COLORS.warnText} variant="Bold" />
              <Text style={styles.warningText}>{noticeWarning}</Text>
            </View>
          ) : null}

          <Text style={[styles.fieldCaption, { marginTop: 16 }]}>Motivo</Text>
          <Text style={styles.helperText}>
            Incluye el motivo, pendientes del día y quién cubre tu puesto.
          </Text>
          <View style={[styles.fieldShellMultiline, motivoFocused && styles.fieldShellFocused]}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              onFocus={() => setMotivoFocused(true)}
              onBlur={() => setMotivoFocused(false)}
              placeholder={
                "Ej. Trámite de acta en registro civil. Dejo pendientes las notas de la ruta 4. Me cubre Ana Pérez."
              }
              placeholderTextColor={COLORS.muted}
              multiline
              numberOfLines={7}
              style={styles.fieldTextArea}
              textAlignVertical="top"
              autoCorrect
            />
          </View>
        </SectionCard>

          <PageFlipReveal delay={FLIP_STAGGER_MS} active={isFocused}>
            <SectionCard title="Evidencias" styles={styles}>
          <View style={styles.attachRow}>
            <Pressable
              style={({ pressed }) => [styles.attachBtn, pressed && styles.attachBtnPressed]}
              onPress={() => void addImage()}
            >
              <Gallery size={20} color={COLORS.accent} variant="Linear" />
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
                    <Trash size={18} color={COLORS.roseText} variant="Linear" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </SectionCard>
          </PageFlipReveal>

          <PageFlipReveal delay={FLIP_STAGGER_MS * 2} active={isFocused}>
            <SoftPressable
              onPress={() => void submit()}
              disabled={submitting}
              scaleTo={0.98}
              accessibilityLabel="Enviar solicitud"
            >
              <View style={[styles.submitBtn, submitting && styles.submitDisabled]}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>Enviar solicitud</Text>
                )}
              </View>
            </SoftPressable>
          </PageFlipReveal>
        </KeyboardAwareScrollView>

      <Modal
        visible={categoryPickerVisible}
        transparent
        animationType="none"
        onRequestClose={closeCategoryPicker}
      >
        <View style={styles.pickerShell}>
          <Animated.View
            style={[
              styles.pickerDim,
              { opacity: categoryOverlayOpacity },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeCategoryPicker}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.pickerCard,
              {
                paddingBottom: Math.max(insets.bottom, 16) + 8,
                transform: [{ translateY: categorySheetY }],
              },
            ]}
          >
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Tipo de permiso</Text>
            <ScrollView style={styles.categoryList} keyboardShouldPersistTaps="handled">
              {PERMISSION_CATEGORY_GROUPS.map((group) => (
                <View key={group.id}>
                  <Text style={styles.groupHeader}>{group.title}</Text>
                  {PERMISSION_CATEGORY_PICKER_OPTIONS.filter(
                    (option) => option.group === group.id,
                  ).map((option) => {
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
                          closeCategoryPicker();
                        }}
                      >
                        <View style={styles.categoryOptionRow}>
                          <View
                            style={[
                              styles.categoryOptionIcon,
                              selected && styles.categoryOptionIconSelected,
                            ]}
                          >
                            <CategoryIcon
                              category={option.value}
                              color={selected ? COLORS.ink : COLORS.muted}
                            />
                          </View>
                          <View style={styles.selectBtnContent}>
                            <View style={styles.selectTitleRow}>
                              <Text
                                style={[
                                  styles.categoryOptionLabel,
                                  selected && styles.categoryOptionLabelSelected,
                                ]}
                              >
                                {option.label}
                              </Text>
                              <View style={styles.payChip}>
                                <Text style={styles.payChipText}>{option.payLabel}</Text>
                              </View>
                            </View>
                            <Text style={styles.categoryOptionHint}>
                              {CATEGORY_HINTS[option.value]}
                            </Text>
                          </View>
                          {selected ? (
                            <TickCircle size={20} color={COLORS.accent} variant="Bold" />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </Animated.View>
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
              themeVariant={scheme}
            />
            <Pressable style={styles.pickerConfirm} onPress={confirmDatePicker}>
              <Text style={styles.pickerConfirmText}>Listo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </View>
  );
}

function createStyles(COLORS: FormColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    safe: { flex: 1 },
    header: { paddingHorizontal: SCREEN_GUTTER },
    scroll: { flex: 1 },
    sectionBlock: {
      width: "100%",
      marginBottom: 18,
    },
    sectionCard: {
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      padding: 16,
    },
    sectionTitle: {
      marginLeft: 4,
      marginBottom: 10,
      fontSize: 13,
      fontWeight: "600",
      color: COLORS.muted,
    },
    helperText: {
      fontSize: 12,
      color: COLORS.muted,
      marginTop: 8,
      lineHeight: 16,
    },
    softShell: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: 14,
      paddingRight: 14,
      borderRadius: 16,
      backgroundColor: COLORS.field,
    },
    softShellPressed: { opacity: 0.88 },
    fieldShell: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: COLORS.field,
      borderWidth: 2,
      borderColor: "transparent",
    },
    fieldShellMultiline: {
      borderRadius: 16,
      backgroundColor: COLORS.field,
      borderWidth: 2,
      borderColor: "transparent",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    fieldShellFocused: {
      borderColor: "rgba(234, 118, 0, 0.8)",
    },
    fieldInput: {
      marginLeft: 12,
      flex: 1,
      fontSize: 16,
      color: COLORS.ink,
      paddingVertical: 0,
    },
    fieldTextArea: {
      flex: 1,
      minHeight: 128,
      fontSize: 16,
      color: COLORS.ink,
      lineHeight: 22,
      paddingVertical: 0,
    },
    softShellFocused: {
      backgroundColor: COLORS.fieldFocus,
      shadowColor: COLORS.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.22,
      shadowRadius: 4,
      elevation: 2,
    },
    softShellMultiline: {
      borderRadius: 16,
      backgroundColor: COLORS.field,
      paddingHorizontal: 14,
      paddingVertical: 4,
    },
    softIcon: {
      marginRight: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    selectBtnContent: { flex: 1, minWidth: 0 },
    selectTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    selectValue: {
      fontSize: 14,
      fontWeight: "600",
      color: COLORS.ink,
    },
    payChip: {
      borderRadius: 999,
      backgroundColor: COLORS.accentSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    payChipText: {
      fontSize: 10,
      fontWeight: "700",
      color: COLORS.accent,
    },
    fieldCaption: {
      fontSize: 13,
      fontWeight: "600",
      color: COLORS.muted,
      marginBottom: 8,
    },
    dateText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: COLORS.ink,
    },
    inputInner: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: COLORS.ink,
      paddingVertical: 12,
    },
    inputSuffix: {
      fontSize: 13,
      fontWeight: "600",
      color: COLORS.muted,
    },
    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: COLORS.field,
      borderRadius: 16,
      padding: 6,
      paddingHorizontal: 8,
    },
    stepperBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperBtnDisabled: { opacity: 0.4 },
    stepperValueWrap: {
      alignItems: "center",
    },
    stepperValue: {
      fontSize: 20,
      fontWeight: "700",
      color: COLORS.ink,
    },
    stepperSuffix: {
      fontSize: 11,
      color: COLORS.muted,
      marginTop: 1,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 14,
      paddingVertical: 2,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 7,
      backgroundColor: COLORS.surface,
      borderWidth: 1.5,
      borderColor: COLORS.divider,
    },
    checkboxLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: COLORS.ink,
    },
    warningBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginTop: 16,
      padding: 12,
      borderRadius: 16,
      backgroundColor: COLORS.warnBg,
    },
    warningText: {
      flex: 1,
      fontSize: 13,
      color: COLORS.warnText,
      fontWeight: "600",
      lineHeight: 18,
    },
    textarea: {
      minHeight: 148,
      fontSize: 14,
      fontWeight: "500",
      color: COLORS.ink,
      lineHeight: 22,
      paddingVertical: 12,
    },
    attachRow: {
      flexDirection: "row",
      gap: 10,
    },
    attachBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: COLORS.field,
      borderRadius: 16,
      paddingVertical: 14,
    },
    attachBtnPressed: { opacity: 0.85 },
    attachBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: COLORS.accent,
    },
    evidenceList: { gap: 8, marginTop: 12 },
    evidenceCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.field,
      borderRadius: 16,
      padding: 10,
      gap: 10,
    },
    thumb: {
      width: 52,
      height: 52,
      borderRadius: 12,
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
      color: COLORS.ink,
      fontWeight: "500",
    },
    removeBtn: {
      padding: 8,
    },
    submitBtn: {
      marginTop: 4,
      marginBottom: 8,
      backgroundColor: COLORS.accent,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
    },
    submitDisabled: { opacity: 0.7 },
    submitText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    pickerShell: {
      flex: 1,
      justifyContent: "flex-end",
    },
    pickerDim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(28, 25, 23, 0.4)",
    },
    pickerOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(28, 25, 23, 0.4)",
    },
    pickerCard: {
      backgroundColor: COLORS.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 8,
      paddingHorizontal: 16,
      maxHeight: "75%",
    },
    pickerHandle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 999,
      backgroundColor: COLORS.field,
      marginBottom: 12,
    },
    pickerTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: COLORS.ink,
      textAlign: "center",
      marginBottom: 12,
    },
    groupHeader: {
      fontSize: 11,
      fontWeight: "700",
      color: COLORS.muted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 8,
      marginTop: 4,
    },
    categoryList: {
      maxHeight: 420,
    },
    categoryOption: {
      padding: 12,
      borderRadius: 16,
      marginBottom: 8,
      backgroundColor: COLORS.field,
    },
    categoryOptionSelected: {
      backgroundColor: COLORS.accentSoft,
    },
    categoryOptionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    categoryOptionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: COLORS.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryOptionIconSelected: {
      backgroundColor: COLORS.surface,
    },
    categoryOptionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: COLORS.ink,
    },
    categoryOptionLabelSelected: {
      color: COLORS.ink,
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
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
    },
    pickerConfirmText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
