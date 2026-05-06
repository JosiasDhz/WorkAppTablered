import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft2,
  ArrowUp2,
  ArrowDown2,
  Barcode,
  Building,
  Calendar,
  CloseCircle,
  Location,
  ReceiptItem,
  ScanBarcode,
  ShoppingCart,
  TrendUp,
  Warning2,
} from "iconsax-react-native";

const { width } = Dimensions.get("window");
const FRAME_SIZE = width * 0.72;

const COLORS = {
  bg: "#F7F7F6",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  border: "#EEF1F4",
  accent: "#EA7600",
  error: "#DC2626",
  errorBg: "#FEF2F2",
  errorBorder: "#FECACA",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Movement = {
  id: string;
  date: string;
  type: "venta" | "entrada" | "ajuste";
  qty: number;
  client?: string;
  folio: string;
};

type PricePoint = { month: string; price: number };
type SalesPoint  = { month: string; qty: number };

type Stats = {
  currentPrice: number;
  priceTrend: "up" | "down" | "stable";
  priceHistory: PricePoint[];
  monthlySales: SalesPoint[];
  lastPurchase: { date: string; supplier: string; qty: number; unitCost: number };
  avgMonthlySales: number;
  stockDays: number;
  turnoverRate: number;
};

type Product = {
  barcode: string;
  sku: string;
  name: string;
  quantity: number;
  location: string;
  branch: string;
  imageUrl: string;
  movements: Movement[];
  stats: Stats;
};

// ─── Product catalog ──────────────────────────────────────────────────────────
const PRODUCTS: Record<string, Product> = {
  "TR2-3-15": {
    barcode: "TR2-3-15",
    sku: "LT-0121.30",
    name: "SAYER LACK BARNIZ ENTINTADO ARCE",
    quantity: 30,
    location: "Panel 1, Piso 3",
    branch: "KarimnotInc",
    imageUrl: "https://cdn.homedepot.com.mx/productos/725236/725236-d.jpg",
    movements: [
      { id: "m1", date: "08 Abr 2026", type: "venta", qty: 3, client: "Construcciones Ramírez", folio: "VTA-00412" },
      { id: "m2", date: "07 Abr 2026", type: "venta", qty: 1, client: "Ferretería del Centro", folio: "VTA-00408" },
      { id: "m3", date: "05 Abr 2026", type: "entrada", qty: 10, folio: "ENT-00198" },
      { id: "m4", date: "03 Abr 2026", type: "venta", qty: 2, client: "Grupo Herrera", folio: "VTA-00391" },
      { id: "m5", date: "01 Abr 2026", type: "ajuste", qty: -1, folio: "AJT-00045" },
      { id: "m6", date: "28 Mar 2026", type: "venta", qty: 4, client: "Diseños Oaxaca SA", folio: "VTA-00377" },
    ],
    stats: {
      currentPrice: 189.50,
      priceTrend: "up",
      priceHistory: [
        { month: "Nov", price: 165.00 },
        { month: "Dic", price: 168.00 },
        { month: "Ene", price: 172.00 },
        { month: "Feb", price: 178.50 },
        { month: "Mar", price: 183.00 },
        { month: "Abr", price: 189.50 },
      ],
      monthlySales: [
        { month: "Nov", qty: 8  },
        { month: "Dic", qty: 14 },
        { month: "Ene", qty: 6  },
        { month: "Feb", qty: 10 },
        { month: "Mar", qty: 12 },
        { month: "Abr", qty: 11 },
      ],
      lastPurchase: { date: "05 Abr 2026", supplier: "Sayer Lacas SA de CV", qty: 10, unitCost: 142.00 },
      avgMonthlySales: 10.2,
      stockDays: 88,
      turnoverRate: 4.1,
    },
  },
  "TR2-3-23": {
    barcode: "TR2-3-23",
    sku: "MDF-15PADF",
    name: "ARAUCO MDF ENCHAPADO PAROTA 15MMX122X244 (NEGRO) DF",
    quantity: 12,
    location: "Panel 4, Piso 2",
    branch: "KarimnotInc",
    imageUrl: "https://framerusercontent.com/images/0oFJR0R7d8pKCgTgiOum5ex0ZAc.jpg",
    movements: [
      { id: "m1", date: "09 Abr 2026", type: "venta", qty: 2, client: "Interiores Modernos", folio: "VTA-00419" },
      { id: "m2", date: "06 Abr 2026", type: "venta", qty: 1, client: "Carpintería Juárez", folio: "VTA-00404" },
      { id: "m3", date: "04 Abr 2026", type: "entrada", qty: 6, folio: "ENT-00201" },
      { id: "m4", date: "02 Abr 2026", type: "venta", qty: 3, client: "Muebles del Sur", folio: "VTA-00388" },
      { id: "m5", date: "30 Mar 2026", type: "ajuste", qty: -2, folio: "AJT-00043" },
      { id: "m6", date: "27 Mar 2026", type: "venta", qty: 1, client: "Casa Bonita Decoraciones", folio: "VTA-00369" },
    ],
    stats: {
      currentPrice: 1240.00,
      priceTrend: "down",
      priceHistory: [
        { month: "Nov", price: 1380.00 },
        { month: "Dic", price: 1350.00 },
        { month: "Ene", price: 1320.00 },
        { month: "Feb", price: 1290.00 },
        { month: "Mar", price: 1260.00 },
        { month: "Abr", price: 1240.00 },
      ],
      monthlySales: [
        { month: "Nov", qty: 4 },
        { month: "Dic", qty: 2 },
        { month: "Ene", qty: 5 },
        { month: "Feb", qty: 3 },
        { month: "Mar", qty: 7 },
        { month: "Abr", qty: 7 },
      ],
      lastPurchase: { date: "04 Abr 2026", supplier: "Arauco México SA de CV", qty: 6, unitCost: 980.00 },
      avgMonthlySales: 4.7,
      stockDays: 77,
      turnoverRate: 2.8,
    },
  },
};

type Phase = "idle" | "scanning" | "loading" | "result" | "not_found";

// ─── Movement type config ─────────────────────────────────────────────────────
const MOVEMENT_CONFIG = {
  venta:   { label: "Venta",   color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",  sign: "-" },
  entrada: { label: "Entrada", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0",  sign: "+" },
  ajuste:  { label: "Ajuste",  color: "#9333EA", bg: "#FAF5FF", border: "#E9D5FF",  sign: "±" },
};

// ─── Shared header ────────────────────────────────────────────────────────────
function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
      <TouchableOpacity
        onPress={onBack}
        style={{
          width: 40, height: 40, borderRadius: 20,
          borderWidth: 1, borderColor: COLORS.border,
          backgroundColor: COLORS.surface,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <ArrowLeft2 size={18} color={COLORS.text} variant="Outline" />
      </TouchableOpacity>
      <Text style={{ marginLeft: 10, fontSize: 34 / 1.35, fontWeight: "900", color: COLORS.text }}>
        {title}
      </Text>
    </View>
  );
}

// ─── Idle screen ──────────────────────────────────────────────────────────────
function IdleView({ onScan }: { onScan: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
      <View style={{
        width: 120, height: 120, borderRadius: 32,
        backgroundColor: "#FFF4EB", borderWidth: 1.5, borderColor: "#F2D0B2",
        alignItems: "center", justifyContent: "center", marginBottom: 28,
      }}>
        <Barcode size={56} color={COLORS.accent} variant="Linear" />
      </View>
      <Text style={{ fontSize: 22, fontWeight: "900", color: COLORS.text, textAlign: "center", marginBottom: 10 }}>
        Escáner de Inventario
      </Text>
      <Text style={{ fontSize: 14, fontWeight: "500", color: COLORS.muted, textAlign: "center", lineHeight: 21, marginBottom: 40 }}>
        Escanea el código de barras de un producto para consultar su información en el inventario.
      </Text>
      <TouchableOpacity
        onPress={onScan}
        activeOpacity={0.85}
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "center",
          backgroundColor: COLORS.accent, borderRadius: 16,
          paddingVertical: 16, paddingHorizontal: 32, width: "100%",
          shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
        }}
      >
        <ScanBarcode size={22} color="#FFFFFF" variant="Linear" />
        <Text style={{ marginLeft: 10, color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>
          Escanear Código de Barras
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Scanner screen ───────────────────────────────────────────────────────────
function ScannerView({ onScanned, onCancel }: { onScanned: (d: string) => void; onCancel: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "code128", "qr", "upc_a", "upc_e", "code39"] }}
        onBarcodeScanned={(r) => onScanned(r.data)}
      />
      <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", marginBottom: FRAME_SIZE / 2, backgroundColor: "rgba(0,0,0,0.6)" }} />
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", marginTop: FRAME_SIZE / 2, backgroundColor: "rgba(0,0,0,0.6)" }} />
        <View style={{ position: "absolute", top: "50%", left: 0, width: (width - FRAME_SIZE) / 2, height: FRAME_SIZE, marginTop: -FRAME_SIZE / 2, backgroundColor: "rgba(0,0,0,0.6)" }} />
        <View style={{ position: "absolute", top: "50%", right: 0, width: (width - FRAME_SIZE) / 2, height: FRAME_SIZE, marginTop: -FRAME_SIZE / 2, backgroundColor: "rgba(0,0,0,0.6)" }} />
        <View style={{ width: FRAME_SIZE, height: FRAME_SIZE, position: "relative" }}>
          <View style={[corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[corner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
          <View style={[corner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[corner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
          <ScanLine frameSize={FRAME_SIZE} />
        </View>
      </View>
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingBottom: 60, alignItems: "center" }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: "600", marginBottom: 24 }}>
          Apunta al código de barras del producto
        </Text>
        <TouchableOpacity
          onPress={onCancel}
          activeOpacity={0.85}
          style={{
            flexDirection: "row", alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12,
            paddingVertical: 12, paddingHorizontal: 24,
            borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
          }}
        >
          <CloseCircle size={18} color="#FFFFFF" variant="Linear" />
          <Text style={{ marginLeft: 8, color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ScanLine({ frameSize }: { frameSize: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, frameSize - 4] });
  return (
    <Animated.View style={{
      position: "absolute", left: 8, right: 8, height: 2, borderRadius: 1,
      backgroundColor: COLORS.accent, shadowColor: COLORS.accent,
      shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6,
      transform: [{ translateY }],
    }} />
  );
}

const corner = {
  position: "absolute" as const,
  width: 26, height: 26,
  borderColor: "#FFFFFF", borderRadius: 3,
};

// ─── Loading screen ───────────────────────────────────────────────────────────
function LoadingView() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, opacity: fadeAnim }}>
      <View style={{
        width: 100, height: 100, borderRadius: 28,
        backgroundColor: "#FFF4EB", borderWidth: 1.5, borderColor: "#F2D0B2",
        alignItems: "center", justifyContent: "center", marginBottom: 28,
      }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: "900", color: COLORS.text, textAlign: "center", marginBottom: 10 }}>
        Obteniendo información...
      </Text>
      <Text style={{ fontSize: 14, fontWeight: "500", color: COLORS.muted, textAlign: "center", lineHeight: 21 }}>
        Consultando el inventario,{"\n"}por favor espera un momento.
      </Text>
      <View style={{ marginTop: 40, width: "100%", gap: 10 }}>
        {[0, 1, 2].map((i) => <SkeletonRow key={i} delay={i * 140} />)}
      </View>
    </Animated.View>
  );
}

function SkeletonRow({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.35)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={{ height: 52, borderRadius: 12, backgroundColor: "#E5E9EE", opacity: anim }} />;
}

// ─── Result screen ────────────────────────────────────────────────────────────
function ResultView({ product, onScanAgain }: { product: Product; onScanAgain: () => void }) {
  const [activeTab, setActiveTab] = useState<"info" | "movimientos" | "estadisticas">("info");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  // index 2 = tab bar (tercer hijo del ScrollView) se queda sticky
  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <ScrollView
        stickyHeaderIndices={[2]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* [0] Product image hero */}
        <View style={{
          marginHorizontal: 20, marginBottom: 14,
          borderRadius: 18, overflow: "hidden",
          backgroundColor: COLORS.surface,
          borderWidth: 1, borderColor: COLORS.border,
          height: 200,
          shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
        }}>
          <Image
            source={{ uri: product.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          <View style={{
            position: "absolute", bottom: 12, right: 12,
            backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 8,
            paddingHorizontal: 10, paddingVertical: 5,
          }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.5 }}>
              {product.barcode}
            </Text>
          </View>
        </View>

        {/* [1] Product name + SKU */}
        <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
          <Text style={{ fontSize: 15, fontWeight: "900", color: COLORS.text, lineHeight: 21, marginBottom: 4 }}>
            {product.name}
          </Text>
          <View style={{ backgroundColor: "#F2F4F7", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.muted }}>SKU: {product.sku}</Text>
          </View>
        </View>

        {/* [2] Tab bar — sticky */}
        <View style={{ backgroundColor: COLORS.bg, paddingHorizontal: 20, paddingBottom: 12, paddingTop: 4 }}>
          <View style={{ flexDirection: "row", backgroundColor: "#EDEFF2", borderRadius: 12, padding: 4, gap: 2 }}>
            {([
              { key: "info",         label: "Información"  },
              { key: "movimientos",  label: "Movimientos"  },
              { key: "estadisticas", label: "Estadísticas" },
            ] as const).map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.85}
                style={{
                  flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: "center",
                  backgroundColor: activeTab === tab.key ? COLORS.surface : "transparent",
                  shadowColor: activeTab === tab.key ? "#000" : "transparent",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.07, shadowRadius: 4, elevation: activeTab === tab.key ? 2 : 0,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: activeTab === tab.key ? COLORS.text : COLORS.muted }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* [3] Tab content */}
        <View style={{ paddingHorizontal: 20 }}>
          {activeTab === "info"         && <InfoTab product={product} onScanAgain={onScanAgain} />}
          {activeTab === "movimientos"  && <MovimientosTab movements={product.movements} />}
          {activeTab === "estadisticas" && <EstadisticasTab stats={product.stats} />}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

// ─── Info tab ─────────────────────────────────────────────────────────────────
function InfoTab({ product, onScanAgain }: { product: Product; onScanAgain: () => void }) {
  return (
    <View style={{ gap: 10 }}>
      {/* Quantity + Location row */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{
          flex: 1, borderRadius: 16, backgroundColor: COLORS.greenBg,
          borderWidth: 1, borderColor: COLORS.greenBorder,
          padding: 16, alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.green, letterSpacing: 0.6, marginBottom: 6 }}>
            EXISTENCIAS
          </Text>
          <Text style={{ fontSize: 38, fontWeight: "900", color: COLORS.green }}>{product.quantity}</Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: COLORS.green, opacity: 0.7 }}>unidades</Text>
        </View>

        <View style={{
          flex: 1, borderRadius: 16, backgroundColor: COLORS.surface,
          borderWidth: 1, borderColor: COLORS.border,
          padding: 16, alignItems: "center", justifyContent: "center",
        }}>
          <Location size={20} color={COLORS.accent} variant="Bold" />
          <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.muted, letterSpacing: 0.6, marginTop: 8, marginBottom: 4 }}>
            UBICACIÓN
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "900", color: COLORS.text, textAlign: "center" }}>
            {product.location}
          </Text>
        </View>
      </View>

      {/* Branch */}
      <View style={{
        borderRadius: 16, backgroundColor: COLORS.surface,
        borderWidth: 1, borderColor: COLORS.border,
        paddingHorizontal: 16, paddingVertical: 14,
        flexDirection: "row", alignItems: "center",
      }}>
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: "#FFF4EB", borderWidth: 1, borderColor: "#F2D0B2",
          alignItems: "center", justifyContent: "center", marginRight: 12,
        }}>
          <Building size={20} color={COLORS.accent} variant="Bold" />
        </View>
        <View>
          <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.muted, letterSpacing: 0.6 }}>SUCURSAL</Text>
          <Text style={{ fontSize: 15, fontWeight: "900", color: COLORS.text, marginTop: 2 }}>{product.branch}</Text>
        </View>
      </View>

      {/* Scan again */}
      <TouchableOpacity
        onPress={onScanAgain}
        activeOpacity={0.85}
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "center",
          backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 16,
          marginTop: 6,
          shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
        }}
      >
        <ScanBarcode size={20} color="#FFFFFF" variant="Linear" />
        <Text style={{ marginLeft: 10, color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>
          Escanear otro producto
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Movimientos tab ──────────────────────────────────────────────────────────
function MovimientosTab({ movements }: { movements: Movement[] }) {
  return (
    <View style={{ gap: 10 }}>
      {movements.map((mov, idx) => {
        const cfg = MOVEMENT_CONFIG[mov.type];
        const isOut = mov.type === "venta";
        const displayQty = mov.type === "ajuste"
          ? `${mov.qty > 0 ? "+" : ""}${mov.qty}`
          : `${cfg.sign}${Math.abs(mov.qty)}`;

        return (
          <View
            key={mov.id}
            style={{
              borderRadius: 14, backgroundColor: COLORS.surface,
              borderWidth: 1, borderColor: COLORS.border,
              paddingHorizontal: 14, paddingVertical: 12,
              flexDirection: "row", alignItems: "center",
            }}
          >
            {/* Icon */}
            <View style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.border,
              alignItems: "center", justifyContent: "center", marginRight: 12,
            }}>
              <ShoppingCart size={18} color={cfg.color} variant={isOut ? "Bold" : "Linear"} />
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <View style={{ backgroundColor: cfg.bg, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: cfg.color, letterSpacing: 0.4 }}>
                    {cfg.label.toUpperCase()}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: "600" }}>{mov.folio}</Text>
              </View>
              {mov.client ? (
                <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.text }} numberOfLines={1}>
                  {mov.client}
                </Text>
              ) : (
                <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.muted }}>Sin cliente</Text>
              )}
              <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: "500", marginTop: 1 }}>{mov.date}</Text>
            </View>

            {/* Qty */}
            <Text style={{ fontSize: 18, fontWeight: "900", color: cfg.color }}>
              {displayQty}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Estadísticas tab ────────────────────────────────────────────────────────
const CHART_HEIGHT = 110;

function BarChart({ data, color, formatValue }: {
  data: { label: string; value: number }[];
  color: string;
  formatValue: (v: number) => string;
}) {
  const anims = useRef(data.map(() => new Animated.Value(0))).current;
  const maxVal = Math.max(...data.map((d) => d.value));

  React.useEffect(() => {
    Animated.stagger(60,
      anims.map((a) => Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: false }))
    ).start();
  }, []);

  return (
    <View style={{ gap: 8 }}>
      {/* Bars */}
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: CHART_HEIGHT, gap: 6 }}>
        {data.map((item, i) => {
          const pct = maxVal > 0 ? item.value / maxVal : 0;
          const barH = anims[i].interpolate({ inputRange: [0, 1], outputRange: [4, Math.max(pct * CHART_HEIGHT, 4)] });
          return (
            <View key={item.label} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: CHART_HEIGHT }}>
              <Text style={{ fontSize: 9, fontWeight: "700", color, marginBottom: 3 }}>
                {formatValue(item.value)}
              </Text>
              <Animated.View style={{ width: "100%", height: barH, borderRadius: 6, backgroundColor: color, opacity: 0.85 }} />
            </View>
          );
        })}
      </View>
      {/* Labels */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        {data.map((item) => (
          <Text key={item.label} style={{ flex: 1, textAlign: "center", fontSize: 10, fontWeight: "600", color: COLORS.muted }}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <View style={{
      flex: 1, borderRadius: 14, backgroundColor: COLORS.surface,
      borderWidth: 1, borderColor: COLORS.border, padding: 14,
      alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ fontSize: 10, fontWeight: "700", color: COLORS.muted, letterSpacing: 0.6, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 22, fontWeight: "900", color: accent ?? COLORS.text }}>{value}</Text>
      {sub ? <Text style={{ fontSize: 11, fontWeight: "500", color: COLORS.muted, marginTop: 2 }}>{sub}</Text> : null}
    </View>
  );
}

function EstadisticasTab({ stats }: { stats: Stats }) {
  const trendColor = stats.priceTrend === "up" ? COLORS.green : stats.priceTrend === "down" ? COLORS.error : COLORS.muted;
  const TrendIcon = stats.priceTrend === "up" ? ArrowUp2 : stats.priceTrend === "down" ? ArrowDown2 : TrendUp;

  const priceChartData = stats.priceHistory.map((p) => ({ label: p.month, value: p.price }));
  const salesChartData = stats.monthlySales.map((s) => ({ label: s.month, value: s.qty }));

  const formatMXN = (v: number) =>
    v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;

  return (
    <View style={{ gap: 12 }}>

      {/* Precio actual */}
      <View style={{
        borderRadius: 16, backgroundColor: COLORS.surface,
        borderWidth: 1, borderColor: COLORS.border, padding: 16,
      }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.muted, letterSpacing: 0.6, marginBottom: 10 }}>
          PRECIO ACTUAL
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 32, fontWeight: "900", color: COLORS.text }}>
            ${stats.currentPrice.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </Text>
          <View style={{
            flexDirection: "row", alignItems: "center",
            backgroundColor: stats.priceTrend === "up" ? COLORS.greenBg : stats.priceTrend === "down" ? COLORS.errorBg : "#F2F4F7",
            borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
            borderWidth: 1,
            borderColor: stats.priceTrend === "up" ? COLORS.greenBorder : stats.priceTrend === "down" ? COLORS.errorBorder : COLORS.border,
          }}>
            <TrendIcon size={14} color={trendColor} variant="Bold" />
            <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: "800", color: trendColor }}>
              {stats.priceTrend === "up" ? "Subiendo" : stats.priceTrend === "down" ? "Bajando" : "Estable"}
            </Text>
          </View>
        </View>
      </View>

      {/* Histórico de precios */}
      <View style={{
        borderRadius: 16, backgroundColor: COLORS.surface,
        borderWidth: 1, borderColor: COLORS.border, padding: 16,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <TrendUp size={16} color={COLORS.accent} variant="Bold" />
          <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: "800", color: COLORS.text }}>
            Histórico de precios
          </Text>
          <Text style={{ marginLeft: "auto" as any, fontSize: 11, fontWeight: "600", color: COLORS.muted }}>
            Últimos 6 meses
          </Text>
        </View>
        <BarChart data={priceChartData} color={COLORS.accent} formatValue={formatMXN} />
      </View>

      {/* Rotación de ventas */}
      <View style={{
        borderRadius: 16, backgroundColor: COLORS.surface,
        borderWidth: 1, borderColor: COLORS.border, padding: 16,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <ShoppingCart size={16} color="#6366F1" variant="Bold" />
          <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: "800", color: COLORS.text }}>
            Rotación de ventas
          </Text>
          <Text style={{ marginLeft: "auto" as any, fontSize: 11, fontWeight: "600", color: COLORS.muted }}>
            Unidades / mes
          </Text>
        </View>
        <BarChart data={salesChartData} color="#6366F1" formatValue={(v) => `${v}`} />
      </View>

      {/* KPI cards row */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <StatCard label="PROM. MENSUAL" value={`${stats.avgMonthlySales}`} sub="unidades" accent={COLORS.accent} />
        <StatCard label="DÍAS DE STOCK" value={`${stats.stockDays}`} sub="días" />
        <StatCard label="ROTACIÓN" value={`${stats.turnoverRate}x`} sub="anual" accent="#6366F1" />
      </View>

      {/* Última compra */}
      <View style={{
        borderRadius: 16, backgroundColor: COLORS.surface,
        borderWidth: 1, borderColor: COLORS.border, padding: 16,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: "#FFF4EB", borderWidth: 1, borderColor: "#F2D0B2",
            alignItems: "center", justifyContent: "center", marginRight: 10,
          }}>
            <ReceiptItem size={18} color={COLORS.accent} variant="Bold" />
          </View>
          <Text style={{ fontSize: 13, fontWeight: "800", color: COLORS.text }}>Última compra</Text>
        </View>

        <View style={{ gap: 8 }}>
          {[
            { label: "Proveedor", value: stats.lastPurchase.supplier },
            { label: "Fecha",     value: stats.lastPurchase.date },
            { label: "Cantidad",  value: `${stats.lastPurchase.qty} unidades` },
            { label: "Costo unitario", value: `$${stats.lastPurchase.unitCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` },
          ].map((row) => (
            <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.muted }}>{row.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.text, maxWidth: "60%", textAlign: "right" }} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

    </View>
  );
}

// ─── Not found screen ─────────────────────────────────────────────────────────
function NotFoundView({ scannedCode, onScanAgain }: { scannedCode: string; onScanAgain: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, opacity: fadeAnim }}>
      <Animated.View style={{ alignItems: "center", transform: [{ scale: scaleAnim }] }}>
        <View style={{
          width: 110, height: 110, borderRadius: 32,
          backgroundColor: COLORS.errorBg, borderWidth: 1.5, borderColor: COLORS.errorBorder,
          alignItems: "center", justifyContent: "center", marginBottom: 28,
        }}>
          <Warning2 size={52} color={COLORS.error} variant="Bold" />
        </View>
        <Text style={{ fontSize: 22, fontWeight: "900", color: COLORS.text, textAlign: "center", marginBottom: 10 }}>
          Código no encontrado
        </Text>
        <Text style={{ fontSize: 14, fontWeight: "500", color: COLORS.muted, textAlign: "center", lineHeight: 21, marginBottom: 20 }}>
          El código escaneado no existe en el inventario.
        </Text>
        <View style={{
          backgroundColor: COLORS.errorBg, borderRadius: 10,
          paddingHorizontal: 16, paddingVertical: 8,
          borderWidth: 1, borderColor: COLORS.errorBorder, marginBottom: 40,
        }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.error, letterSpacing: 0.5 }}>
            Código: {scannedCode}
          </Text>
        </View>
      </Animated.View>
      <TouchableOpacity
        onPress={onScanAgain}
        activeOpacity={0.85}
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "center",
          backgroundColor: COLORS.accent, borderRadius: 16,
          paddingVertical: 16, paddingHorizontal: 32, width: "100%",
          shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
        }}
      >
        <ScanBarcode size={20} color="#FFFFFF" variant="Linear" />
        <Text style={{ marginLeft: 10, color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>Intentar de nuevo</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Inventory() {
  const navigation = useNavigation();
  const [phase, setPhase] = useState<Phase>("idle");
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [lastScanned, setLastScanned] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const hasScanned = useRef(false);

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    hasScanned.current = false;
    setPhase("scanning");
  };

  const handleBarcodeScanned = (data: string) => {
    if (hasScanned.current) return;
    hasScanned.current = true;
    setLastScanned(data);
    setPhase("loading");
    setTimeout(() => {
      const product = PRODUCTS[data] ?? null;
      setFoundProduct(product);
      setPhase(product ? "result" : "not_found");
    }, 2500);
  };

  const handleBack = () => {
    if (phase === "result" || phase === "not_found") {
      setPhase("idle");
      setFoundProduct(null);
    } else {
      navigation.goBack();
    }
  };

  const headerTitle =
    phase === "result" ? "Producto encontrado" :
    phase === "not_found" ? "No encontrado" :
    "Inventario";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: phase === "scanning" ? "#000" : COLORS.bg }}
      edges={["top", "left", "right"]}
    >
      {phase !== "scanning" && <Header onBack={handleBack} title={headerTitle} />}

      {phase === "idle" && <IdleView onScan={handleOpenCamera} />}
      {phase === "scanning" && (
        <ScannerView onScanned={handleBarcodeScanned} onCancel={() => setPhase("idle")} />
      )}
      {phase === "loading" && <LoadingView />}
      {phase === "result" && foundProduct && (
        <ResultView product={foundProduct} onScanAgain={handleOpenCamera} />
      )}
      {phase === "not_found" && (
        <NotFoundView scannedCode={lastScanned} onScanAgain={handleOpenCamera} />
      )}
    </SafeAreaView>
  );
}
