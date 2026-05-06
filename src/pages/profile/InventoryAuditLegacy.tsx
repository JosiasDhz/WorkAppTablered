import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import {
  Add,
  ArrowLeft2,
  Barcode,
  CloseCircle,
  DocumentText,
  Edit2,
  Location,
  ScanBarcode,
  TickCircle,
  Warning2,
} from "iconsax-react-native";

const { width } = Dimensions.get("window");

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg:           "#F7F7F6",
  surface:      "#FFFFFF",
  text:         "#0F172A",
  muted:        "#6B7280",
  border:       "#EEF1F4",
  accent:       "#EA7600",
  red:          "#DC2626",
  redBg:        "#FEF2F2",
  redBorder:    "#FECACA",
  green:        "#16A34A",
  greenBg:      "#F0FDF4",
  greenBorder:  "#BBF7D0",
};

// ─── Demo catalog ─────────────────────────────────────────────────────────────
type Product = { sku: string; name: string };

const DEMO_PRODUCTS: Record<string, Product> = {
  "YAGDC5VEN":        { sku: "YAGDC5VEN",        name: "YALE CERRADURA ENTRADA PRINCIPAL MOD.VENECIA (80878) LATON ANTIGUO" },
  "MX83355":          { sku: "MX83355",           name: "YALE CERRADURA DIGITAL YSD100 P/PUERTAS DE MADERA ACABADO NEGRO INTERIOR" },
  "MDF-TA-5.5":       { sku: "MDF-TA-5.5",        name: "SIDERI MDF NATURAL TAILANDIA 5.5MM 1220 X 2440 MTS" },
  "MDF-180-5-EN-ENN": { sku: "MDF-180-5-EN-ENN",  name: "ARAUCO MDF ENCHAPADO ENCINO 18MMX122X244 (CHAPA GRUESA) (OFERTA)" },
  "DC-DP13N":         { sku: "DC-DP13N",          name: 'SILVERLINE TALADRO DE BANCO, MOTOR 3/4 HP 110V MONOFASICO 16VELS CHUCK 5/8"' },
  "DC-SI10-DS":       { sku: "DC-SI10-DS",        name: 'SILVERLINE SIERRA INGLETEADORA 10" 2.5HP/110V 1 FACE DESLIZABLE' },
};

const LUGARES = ["Rack", "Panel", "Estante", "Vitrina"] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type AuditRow    = { productId: string; sku: string; name: string; observedQuantity: string };
type Phase       = "setup" | "loading_inventory" | "audit";
type AuditTab    = "tabla" | "scanner";

// ─── Scanner helpers ──────────────────────────────────────────────────────────
const cornerStyle = {
  position: "absolute" as const,
  width: 24,
  height: 24,
  borderColor: "#FFFFFF",
};

function ScanLine({ frameSize }: { frameSize: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: frameSize - 4, duration: 1800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0,             duration: 1800, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={{
        position: "absolute", left: 0, right: 0, height: 2,
        backgroundColor: C.accent, opacity: 0.85,
        transform: [{ translateY: anim }],
        shadowColor: C.accent, shadowOpacity: 0.8, shadowRadius: 4, elevation: 4,
      }}
    />
  );
}

// ─── Header — same style as Inventory.tsx ─────────────────────────────────────
function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
      <TouchableOpacity
        onPress={onBack}
        style={{
          width: 40, height: 40, borderRadius: 20,
          borderWidth: 1, borderColor: C.border,
          backgroundColor: C.surface,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <ArrowLeft2 size={18} color={C.text} variant="Outline" />
      </TouchableOpacity>
      <Text style={{ marginLeft: 10, fontSize: 17, fontWeight: "900", color: C.text }}>
        {title}
      </Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function InventoryAudit() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();

  // ── Setup state
  const [phase, setPhase]           = useState<Phase>("setup");
  const [lugar, setLugar]           = useState<string | null>(null);
  const [lugarLocked, setLugarLocked] = useState(false);
  const [numeroInput, setNumeroInput] = useState("");
  const [numero, setNumero]         = useState<string | null>(null);
  const [numeroLocked, setNumeroLocked] = useState(false);

  // ── Audit state
  const [auditTab, setAuditTab]     = useState<AuditTab>("tabla");
  const [rows, setRows]             = useState<AuditRow[]>([]);

  // ── Audit extras
  const [comments, setComments]   = useState("");
  const [saving, setSaving]       = useState(false);

  // ── Scanner state
  const [scanPreview, setScanPreview] = useState<Product | null>(null);
  const [scanQty, setScanQty]         = useState("");
  const [scanSaving, setScanSaving]   = useState(false);
  const [scanSaved, setScanSaved]     = useState(false);
  const [notFound, setNotFound]       = useState(false);
  const scanRef = useRef(false);

  const canStart    = lugar !== null && numero !== null;
  const countedCount = rows.filter((r) => r.observedQuantity !== "").length;
  const allCounted  = rows.length > 0 && countedCount === rows.length;

  // ── Handlers
  const confirmNumero = () => {
    if (!numeroInput) return;
    setNumero(numeroInput);
    setNumeroLocked(true);
  };

  const resetLocation = () => {
    setLugar(null);
    setLugarLocked(false);
    setNumeroInput("");
    setNumero(null);
    setNumeroLocked(false);
  };

  const iniciarAuditoria = () => {
    setPhase("loading_inventory");
    setTimeout(() => {
      setRows(
        Object.values(DEMO_PRODUCTS).map((p) => ({
          productId: p.sku,
          sku: p.sku,
          name: p.name,
          observedQuantity: "",
        })),
      );
      setPhase("audit");
    }, 1800);
  };

  const updateObserved = (productId: string, val: string) => {
    setRows((prev) =>
      prev.map((r) => r.productId === productId ? { ...r, observedQuantity: val.replace(/\D/g, "") } : r),
    );
  };

  const handleBarcode = (data: string) => {
    if (scanRef.current || scanPreview) return;
    scanRef.current = true;
    const product = DEMO_PRODUCTS[data] ?? null;
    if (product) {
      setScanPreview(product);
      setScanQty("");
      setScanSaved(false);
      setNotFound(false);
    } else {
      setNotFound(true);
      setTimeout(() => {
        setNotFound(false);
        scanRef.current = false;
      }, 2200);
    }
  };

  const dismissScanPreview = () => {
    setScanPreview(null);
    setScanQty("");
    setScanSaved(false);
    scanRef.current = false;
  };

  const saveScanResult = () => {
    if (!scanPreview || !scanQty) return;
    setScanSaving(true);
    setTimeout(() => {
      setRows((prev) =>
        prev.map((r) => r.productId === scanPreview.sku ? { ...r, observedQuantity: scanQty } : r),
      );
      setScanSaving(false);
      setScanSaved(true);
      setTimeout(dismissScanPreview, 1200);
    }, 900);
  };

  const switchToScannerTab = async () => {
    if (!permission?.granted) await requestPermission();
    setAuditTab("scanner");
    dismissScanPreview();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Loading inventory
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === "loading_inventory") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "left", "right"]}>
        <Header onBack={() => setPhase("setup")} title="Cargando inventario…" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View style={{
            width: 100, height: 100, borderRadius: 28,
            backgroundColor: "#FFF4EB", borderWidth: 1.5, borderColor: "#F2D0B2",
            alignItems: "center", justifyContent: "center", marginBottom: 28,
          }}>
            <ActivityIndicator size="large" color={C.accent} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "900", color: C.text, textAlign: "center", marginBottom: 10 }}>
            Obteniendo inventario…
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "500", color: C.muted, textAlign: "center", lineHeight: 21 }}>
            Consultando los productos de{"\n"}{lugar} #{numero}.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Setup
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === "setup") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "left", "right"]}>
        <Header onBack={() => (navigation as any).goBack()} title="Auditoría de Inventario" />

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{
            backgroundColor: C.surface, borderRadius: 18, padding: 20,
            borderWidth: 1, borderColor: C.border,
            shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
          }}>
            {/* Section label */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: C.accent, marginRight: 8 }} />
              <Text style={{ fontSize: 13, fontWeight: "800", color: C.text, flex: 1 }}>Ubicación</Text>
              {(lugarLocked || numeroLocked) && (
                <TouchableOpacity
                  onPress={resetLocation}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 5,
                    backgroundColor: C.redBg, borderRadius: 8,
                    paddingHorizontal: 10, paddingVertical: 5,
                    borderWidth: 1, borderColor: C.redBorder,
                  }}
                >
                  <Edit2 size={14} color={C.red} variant="Bold" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: C.red }}>Cambiar</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Lugar chips */}
            <Text style={{ fontSize: 11, fontWeight: "700", color: C.muted, letterSpacing: 0.6, marginBottom: 10 }}>LUGAR</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
              keyboardShouldPersistTaps="handled"
            >
              {LUGARES.map((opt) => {
                const selected = lugar === opt;
                const disabled = lugarLocked && !selected;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => {
                      if (lugarLocked) return;
                      setLugar(opt);
                      setLugarLocked(true);
                    }}
                    activeOpacity={lugarLocked ? 1 : 0.8}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 6,
                      paddingVertical: 10, paddingHorizontal: 14,
                      borderRadius: 12, borderWidth: 1.5,
                      backgroundColor: selected ? C.accent : C.surface,
                      borderColor:     selected ? C.accent : C.border,
                      opacity: disabled ? 0.4 : 1,
                    }}
                  >
                    <Location size={16} color={selected ? "#FFFFFF" : C.muted} variant="Bold" />
                    <Text style={{ fontSize: 14, fontWeight: "700", color: selected ? "#FFFFFF" : C.text }}>
                      {opt}
                    </Text>
                    {selected && <TickCircle size={15} color="#FFFFFF" variant="Bold" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Número — only show after lugar selected */}
            {lugar && (
              <>
                <Text style={{ fontSize: 11, fontWeight: "700", color: C.muted, letterSpacing: 0.6, marginTop: 20, marginBottom: 10 }}>
                  NÚMERO
                </Text>

                {!numeroLocked ? (
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{
                      flex: 1, flexDirection: "row", alignItems: "center",
                      backgroundColor: "#F8F9FB", borderRadius: 12,
                      borderWidth: 1.5, borderColor: C.border,
                      paddingHorizontal: 14, height: 50,
                    }}>
                      <Text style={{ fontSize: 18, fontWeight: "700", color: C.muted, marginRight: 6 }}>#</Text>
                      <TextInput
                        value={numeroInput}
                        onChangeText={(v) => setNumeroInput(v.replace(/\D/g, ""))}
                        placeholder="Ej: 3"
                        placeholderTextColor={C.muted}
                        keyboardType="number-pad"
                        maxLength={3}
                        returnKeyType="done"
                        onSubmitEditing={confirmNumero}
                        style={{ flex: 1, fontSize: 18, fontWeight: "700", color: C.text, padding: 0 }}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={confirmNumero}
                      disabled={!numeroInput}
                      activeOpacity={0.85}
                      style={{
                        height: 50, paddingHorizontal: 20, borderRadius: 12,
                        backgroundColor: numeroInput ? C.accent : C.border,
                        flexDirection: "row", alignItems: "center", gap: 6,
                      }}
                    >
                      <TickCircle size={17} color="#FFFFFF" variant="Bold" />
                      <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>OK</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start",
                    backgroundColor: C.accent, borderRadius: 12,
                    paddingVertical: 10, paddingHorizontal: 16,
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>#</Text>
                    <Text style={{ fontSize: 22, fontWeight: "900", color: "#FFFFFF" }}>{numero}</Text>
                    <TickCircle size={20} color="#FFFFFF" variant="Bold" />
                  </View>
                )}
              </>
            )}

            {/* Start button */}
            {canStart && (
              <TouchableOpacity
                onPress={iniciarAuditoria}
                activeOpacity={0.85}
                style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "center",
                  backgroundColor: C.accent, borderRadius: 14, paddingVertical: 15,
                  marginTop: 24, gap: 10,
                  shadowColor: C.accent, shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
                }}
              >
                <Add size={20} color="#FFFFFF" variant="Bold" />
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>Iniciar auditoría</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Audit
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "left", "right"]}>
      <Header onBack={() => setPhase("setup")} title={`${lugar} #${numero}`} />

      {/* Progress bar */}
      <View style={{
        marginHorizontal: 16, marginBottom: 10,
        backgroundColor: C.surface, borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: C.border,
        flexDirection: "row", alignItems: "center",
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: C.muted, letterSpacing: 0.5, marginBottom: 6 }}>PROGRESO</Text>
          <View style={{ height: 6, backgroundColor: C.border, borderRadius: 3, overflow: "hidden" }}>
            <View style={{
              height: 6, borderRadius: 3, backgroundColor: C.accent,
              width: `${rows.length > 0 ? (countedCount / rows.length) * 100 : 0}%` as any,
            }} />
          </View>
        </View>
        <Text style={{ marginLeft: 16, fontSize: 24, fontWeight: "900", color: C.accent }}>
          {countedCount}
          <Text style={{ fontSize: 14, fontWeight: "600", color: C.muted }}>/{rows.length}</Text>
        </Text>
      </View>

      {/* Tab bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", backgroundColor: "#EDEFF2", borderRadius: 12, padding: 4 }}>
          <TouchableOpacity
            onPress={() => { setAuditTab("tabla"); dismissScanPreview(); }}
            activeOpacity={0.85}
            style={{
              flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: "center",
              backgroundColor: auditTab === "tabla" ? C.surface : "transparent",
              shadowColor: auditTab === "tabla" ? "#000" : "transparent",
              shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
              elevation: auditTab === "tabla" ? 2 : 0,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: auditTab === "tabla" ? C.text : C.muted }}>
              Tabla
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={switchToScannerTab}
            activeOpacity={0.85}
            style={{
              flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: "center",
              backgroundColor: auditTab === "scanner" ? C.surface : "transparent",
              shadowColor: auditTab === "scanner" ? "#000" : "transparent",
              shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
              elevation: auditTab === "scanner" ? 2 : 0,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: auditTab === "scanner" ? C.text : C.muted }}>
              Escáner
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tabla tab ── */}
      {auditTab === "tabla" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Table header */}
          <View style={{ flexDirection: "row", paddingHorizontal: 12, marginBottom: 6 }}>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Producto
            </Text>
            <Text style={{ width: 80, fontSize: 10, fontWeight: "800", color: C.muted, textAlign: "center", textTransform: "uppercase" }}>
              Encontrados
            </Text>
          </View>

          {rows.map((row) => {
            const isFilled = row.observedQuantity !== "";
            return (
              <View
                key={row.productId}
                style={{
                  backgroundColor: isFilled ? C.greenBg : C.surface,
                  borderRadius: 12, marginBottom: 6,
                  borderWidth: 1, borderColor: isFilled ? C.greenBorder : C.border,
                  flexDirection: "row", alignItems: "center",
                  paddingLeft: 0, paddingRight: 10, paddingVertical: 10,
                  overflow: "hidden",
                  shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
                }}
              >
                <View style={{
                  width: 3, borderRadius: 2,
                  backgroundColor: isFilled ? C.green : C.border,
                  alignSelf: "stretch", marginRight: 10, marginLeft: 0,
                }} />

                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: C.muted, marginBottom: 1 }}>{row.sku}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: C.text, lineHeight: 17 }} numberOfLines={2}>
                    {row.name}
                  </Text>
                </View>

                <TextInput
                  value={row.observedQuantity}
                  onChangeText={(v) => updateObserved(row.productId, v)}
                  placeholder="—"
                  placeholderTextColor={C.muted}
                  keyboardType="number-pad"
                  textAlign="center"
                  maxLength={4}
                  style={{
                    width: 72, height: 44, borderRadius: 10,
                    backgroundColor: isFilled ? C.surface : "#F8F9FB",
                    borderWidth: 1.5, borderColor: isFilled ? C.green : C.border,
                    fontSize: 18, fontWeight: "900",
                    color: isFilled ? C.green : C.text,
                    textAlign: "center",
                  }}
                />
              </View>
            );
          })}

          {/* Observaciones */}
          <View style={{
            backgroundColor: C.surface, borderRadius: 14, marginTop: 10,
            borderWidth: 1, borderColor: C.border, overflow: "hidden",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: C.accent, marginRight: 8 }} />
              <Text style={{ fontSize: 12, fontWeight: "800", color: C.text, flex: 1 }}>Observaciones</Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: C.muted }}>{comments.length}/500</Text>
            </View>
            <TextInput
              value={comments}
              onChangeText={(v) => v.length <= 500 && setComments(v)}
              placeholder="Notas, incidencias u observaciones de la auditoría…"
              placeholderTextColor={C.muted}
              multiline
              textAlignVertical="top"
              maxLength={500}
              style={{
                minHeight: 90, paddingHorizontal: 14, paddingVertical: 12,
                fontSize: 14, fontWeight: "500", color: C.text, lineHeight: 20,
              }}
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            onPress={() => {
              if (!allCounted || saving) return;
              setSaving(true);
              setTimeout(() => {
                setSaving(false);
                (navigation as any).goBack();
              }, 1800);
            }}
            disabled={!allCounted || saving}
            activeOpacity={0.85}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "center",
              borderRadius: 14, paddingVertical: 15, marginTop: 12, gap: 10,
              backgroundColor: allCounted ? C.accent : C.border,
              shadowColor: allCounted ? C.accent : "transparent",
              shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: allCounted ? 6 : 0,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <DocumentText size={18} color="#FFFFFF" variant="Bold" />
                <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>
                  {allCounted ? "Guardar auditoría" : `Faltan ${rows.length - countedCount} productos`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Scanner tab ── */}
      {auditTab === "scanner" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Camera */}
          <View style={{
            height: 280, borderRadius: 18, overflow: "hidden",
            backgroundColor: "#000", marginBottom: 14,
            shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
          }}>
            {permission?.granted ? (
              <>
                <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "code128", "qr", "upc_a", "upc_e", "code39"] }}
                  onBarcodeScanned={scanPreview ? undefined : (r) => handleBarcode(r.data)}
                />
                <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                  <View style={{ width: "78%", height: "60%", position: "relative" }}>
                    <View style={[cornerStyle, { top: 0,    left:  0, borderTopWidth: 3,    borderLeftWidth:  3 }]} />
                    <View style={[cornerStyle, { top: 0,    right: 0, borderTopWidth: 3,    borderRightWidth: 3 }]} />
                    <View style={[cornerStyle, { bottom: 0, left:  0, borderBottomWidth: 3, borderLeftWidth:  3 }]} />
                    <View style={[cornerStyle, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
                    {!scanPreview && <ScanLine frameSize={168} />}
                  </View>
                </View>
                {notFound && (
                  <View style={{
                    position: "absolute", bottom: 12, left: 16, right: 16,
                    backgroundColor: "rgba(220,38,38,0.9)", borderRadius: 10,
                    paddingVertical: 8, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8,
                  }}>
                    <Warning2 size={16} color="#FFFFFF" variant="Bold" />
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
                      Código no encontrado en el catálogo
                    </Text>
                  </View>
                )}
                {!scanPreview && !notFound && (
                  <View style={{ position: "absolute", bottom: 14, left: 0, right: 0, alignItems: "center" }}>
                    <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" }}>
                      Apunta al código de barras
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <TouchableOpacity
                onPress={requestPermission}
                style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}
                activeOpacity={0.85}
              >
                <Warning2 size={40} color="rgba(255,255,255,0.6)" variant="Bold" />
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, fontWeight: "700", textAlign: "center" }}>
                  Se requiere acceso a la cámara
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "500", textAlign: "center" }}>
                  Toca aquí para otorgar permisos
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Scan result / hint */}
          {scanPreview ? (
            <View style={{
              backgroundColor: C.surface, borderRadius: 18, padding: 18,
              borderWidth: 1, borderColor: C.border,
              shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: "#FFF4EB", borderWidth: 1, borderColor: "#F2D0B2",
                  alignItems: "center", justifyContent: "center", marginRight: 12,
                }}>
                  <Barcode size={22} color={C.accent} variant="Linear" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: C.muted, marginBottom: 2 }}>
                    {scanPreview.sku}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: C.text, lineHeight: 18 }} numberOfLines={2}>
                    {scanPreview.name}
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 11, fontWeight: "700", color: C.muted, letterSpacing: 0.5, marginBottom: 8 }}>
                CANTIDAD ENCONTRADA
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  value={scanQty}
                  onChangeText={(v) => setScanQty(v.replace(/\D/g, ""))}
                  placeholder="0"
                  placeholderTextColor={C.muted}
                  keyboardType="number-pad"
                  maxLength={4}
                  style={{
                    width: 80, height: 50, borderRadius: 12,
                    backgroundColor: "#F8F9FB", borderWidth: 1.5, borderColor: C.border,
                    fontSize: 22, fontWeight: "900", color: C.text,
                    textAlign: "center",
                  }}
                />
                <TouchableOpacity
                  onPress={saveScanResult}
                  disabled={!scanQty || scanSaving || scanSaved}
                  activeOpacity={0.85}
                  style={{
                    flex: 1, height: 50, borderRadius: 12,
                    backgroundColor: scanSaved ? C.green : (!scanQty ? C.border : C.accent),
                    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                    shadowColor: scanSaved ? C.green : C.accent,
                    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
                  }}
                >
                  {scanSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : scanSaved ? (
                    <>
                      <TickCircle size={18} color="#FFFFFF" variant="Bold" />
                      <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>¡Guardado!</Text>
                    </>
                  ) : (
                    <>
                      <DocumentText size={18} color="#FFFFFF" variant="Bold" />
                      <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>Guardar en BD</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={dismissScanPreview} activeOpacity={0.8}
                style={{ alignItems: "center", paddingTop: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: C.muted }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            !notFound && (
              <View style={{
                backgroundColor: C.surface, borderRadius: 16, padding: 16,
                borderWidth: 1, borderColor: C.border, flexDirection: "row", alignItems: "center", gap: 12,
              }}>
                <View style={{
                  width: 42, height: 42, borderRadius: 12,
                  backgroundColor: "#FFF4EB", borderWidth: 1, borderColor: "#F2D0B2",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <ScanBarcode size={20} color={C.accent} variant="Linear" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: C.text }}>Listo para escanear</Text>
                  <Text style={{ fontSize: 12, fontWeight: "500", color: C.muted, marginTop: 2 }}>
                    Apunta la cámara a un código de barras
                  </Text>
                </View>
              </View>
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
