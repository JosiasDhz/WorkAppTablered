import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft2, Coin, DocumentText, MoneyRecive } from "iconsax-react-native";

const formatMXN = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default function SaleDetail() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { folio, points, sucursal, date } = route.params || {};

  const numericPoints = typeof points === "number" ? points : Number(points) || 0;
  const { width } = Dimensions.get("window");
  const paidMethod = "Efectivo";
  const [activeProduct, setActiveProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const products = useMemo(() => {
    const baseQty = 1 + (numericPoints % 3); // 1-3
    const count = 2 + (numericPoints % 4); // 2-5

    const all = [
      { id: "a", name: "MDF 15mm", qty: baseQty, unit: 899 },
      { id: "b", name: "Triplay 18mm", qty: 1 + (baseQty % 3), unit: 980 },
      {
        id: "c",
        name: "Aglomerado melamina blanca 16mm",
        qty: 1 + ((baseQty + 1) % 3),
        unit: 1210,
      },
      { id: "d", name: "Accesorios de instalación", qty: 2 + (numericPoints % 2), unit: 220 },
      { id: "e", name: "Tornillería y herrajes", qty: 1 + ((numericPoints + 1) % 2), unit: 310 },
    ];

    return all.slice(0, count);
  }, [numericPoints]);

  const total = products.reduce((sum, p) => sum + p.qty * p.unit, 0);

  const getSaleChannel = (productId: string, idx: number) => {
    // Demo: asignación por producto
    if (productId === "a") {
      return {
        label: "Maquila",
        badgeBg: "#E11D4820",
        badgeBorder: "#E11D483A",
        badgeText: "#E11D48",
        subtitle: "Se trabaja bajo pedido",
        details: [
          "Tiempo estimado: 2-3 días ",
          "Incluye trazo y corte",
          "Se confirma antes de fabricar",
        ],
      };
    }
    if (productId === "b") {
      return {
        label: "Mostrador",
        badgeBg: "#16A34A20",
        badgeBorder: "#16A34A3A",
        badgeText: "#15803D",
        subtitle: "Listo para recoger",
        details: ["Tiempo de surtido: 30 min ", "Recoge en sucursal", "Se requiere identificación"],
      };
    }
    if (productId === "c") {
      return {
        label: "Domicilio",
        badgeBg: "#2563EB20",
        badgeBorder: "#2563EB3A",
        badgeText: "#1D4ED8",
        subtitle: "Entrega a dirección",
        details: [
          "Costo envío: $150 MXN ",
          "Tiempo estimado: 1 día hábil ",
          "Entrega sujeta a confirmación",
        ],
      };
    }

    const options = [
      {
        label: "Maquila",
        badgeBg: "#E11D4820",
        badgeBorder: "#E11D483A",
        badgeText: "#E11D48",
        subtitle: "Se trabaja bajo pedido",
        details: [
          "Tiempo estimado: 2-3 días ",
          "Incluye trazo y corte",
          "Se confirma antes de fabricar",
        ],
      },
      {
        label: "Mostrador",
        badgeBg: "#16A34A20",
        badgeBorder: "#16A34A3A",
        badgeText: "#15803D",
        subtitle: "Listo para recoger",
        details: ["Tiempo de surtido: 30 min ", "Recoge en sucursal", "Se requiere identificación"],
      },
      {
        label: "Domicilio",
        badgeBg: "#2563EB20",
        badgeBorder: "#2563EB3A",
        badgeText: "#1D4ED8",
        subtitle: "Entrega a dirección",
        details: [
          "Costo envío: $150 MXN ",
          "Tiempo estimado: 1 día hábil ",
          "Entrega sujeta a confirmación",
        ],
      },
    ];

    return options[idx % options.length];
  };

  const openProductModal = (product: any, idx: number) => {
    const saleChannel = getSaleChannel(product.id, idx);
    setActiveProduct({ ...product, saleChannel });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setActiveProduct(null), 200);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, alignItems: "center" }}
      >
        {/* Header */}
        <View
          style={{
            width: width * 0.92,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
            marginBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 8 },
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <ArrowLeft2 size={20} color="#1D1D1B" />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 16,
              fontWeight: "900",
              color: "#111827",
            }}
            numberOfLines={1}
          >
            Detalle de la venta
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {/* Resumen */}
        <View
          style={{
            width: width * 0.92,
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            padding: 16,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 18,
            elevation: 4,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <DocumentText size={18} color="#111827" />
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#6B7280" }}>
                  Folio
                </Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: "900", color: "#111827", marginTop: 2 }}>
                {folio ?? "—"}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#FEE2E2",
                borderWidth: 1,
                borderColor: "#FECACA",
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: "#991B1B", fontSize: 11, fontWeight: "900" }}>
                +{numericPoints} pts
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#F9FAFB",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                padding: 12,
              }}
            >
              <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "800" }}>
                Productos
              </Text>
              <Text style={{ color: "#111827", fontSize: 22, fontWeight: "900", marginTop: 2 }}>
                {products.length}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#F9FAFB",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                padding: 12,
              }}
            >
              <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "800" }}>
                Total
              </Text>
              <Text style={{ color: "#111827", fontSize: 22, fontWeight: "900", marginTop: 2 }}>
                {formatMXN(total)}
              </Text>
            </View>
          </View>

          {/* Pago */}
          <View
            style={{
              marginTop: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              paddingHorizontal: 6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 14,
                  backgroundColor: "#E51E2F12",
                  borderWidth: 1,
                  borderColor: "#E51E2F33",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MoneyRecive size={16} color="#E51E2F" variant="Bold" />
              </View>
              <View>
                <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "800" }}>
                  Pagado con
                </Text>
                <Text style={{ color: "#111827", fontSize: 14, fontWeight: "900", marginTop: 2 }}>
                  {paidMethod}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              marginTop: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 6,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "800" }}>
                Sucursal
              </Text>
              <Text style={{ color: "#111827", fontSize: 14, fontWeight: "900", marginTop: 2 }}>
                {sucursal ?? "—"}
              </Text>
            </View>

            <View style={{ width: 10 }} />

            <View style={{ flex: 1 }}>
              <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "800" }}>
                Fecha
              </Text>
              <Text style={{ color: "#111827", fontSize: 14, fontWeight: "900", marginTop: 2 }}>
                {date ?? "—"}
              </Text>
            </View>
          </View>

          <View
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              backgroundColor: "#FFFFFF",
            }}
          >
            <Text
              style={{
                color: "#6B7280",
                fontSize: 12,
                fontWeight: "900",
                marginBottom: 10,
              }}
            >
              Desglose de productos
            </Text>

            {products.map((p, idx) => {
              const saleChannel = getSaleChannel(p.id, idx);
              return (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.9}
                  onPress={() => openProductModal(p, idx)}
                  style={{}}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 10,
                      borderTopWidth: 1,
                      borderTopColor: "#F3F4F6",
                      gap: 10,
                    }}
                  >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    backgroundColor: "#F9FAFB",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <DocumentText size={16} color="#1D1D1B" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#111827",
                      fontSize: 13,
                      fontWeight: "900",
                    }}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                  <Text
                    style={{
                      color: "#6B7280",
                      fontSize: 12,
                      fontWeight: "700",
                      marginTop: 2,
                    }}
                  >
                    {p.qty} pz 
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <View
                    style={{
                      backgroundColor: saleChannel.badgeBg,
                      borderColor: saleChannel.badgeBorder,
                      borderWidth: 1,
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: saleChannel.badgeText,
                        fontSize: 11,
                        fontWeight: "900",
                      }}
                    >
                      {saleChannel.label}
                    </Text>
                  </View>
                  {/* <Text style={{ color: "#111827", fontSize: 13, fontWeight: "900" }}>
                    {formatMXN(p.qty * p.unit)}
                  </Text> */}
                </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Modal con detalles por producto */}
        <Modal transparent visible={isModalOpen} animationType="fade" onRequestClose={closeModal}>
          <View
            style={{
              flex: 1,
              backgroundColor: "#00000055",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 18,
            }}
          >
            <View
              style={{
                width: width * 0.92,
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                padding: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "800" }}>Producto</Text>
                  <Text
                    style={{ color: "#111827", fontSize: 16, fontWeight: "900", marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {activeProduct?.name ?? ""}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={closeModal}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#F3F4F6",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    marginLeft: 10,
                  }}
                >
                  <Text style={{ color: "#111827", fontSize: 18, fontWeight: "900" }}>×</Text>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  backgroundColor: activeProduct?.saleChannel?.badgeBg ?? "#F3F4F6",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: activeProduct?.saleChannel?.badgeBorder ?? "#E5E7EB",
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: activeProduct?.saleChannel?.badgeText ?? "#111827", fontSize: 13, fontWeight: "900" }}>
                  {activeProduct?.saleChannel?.label ?? ""}
                </Text>
                <Text style={{ color: "#111827", fontSize: 14, fontWeight: "800", marginTop: 2 }}>
                  {activeProduct?.saleChannel?.subtitle ?? ""}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "#F9FAFB",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "900", marginBottom: 8 }}>
                  Cómo se vendió 
                </Text>
                {(activeProduct?.saleChannel?.details ?? []).map((d: string, i: number) => (
                  <View
                    key={`detail-${i}`}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      marginBottom: 6,
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#c6c216",
                        marginTop: 5,
                      }}
                    />
                    <Text style={{ color: "#111827", fontSize: 13, fontWeight: "700" }}>{d}</Text>
                  </View>
                ))}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingTop: 4,
                  borderTopWidth: 1,
                  borderTopColor: "#F3F4F6",
                }}
              >
                <View>
                  <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "800" }}>Cantidad</Text>
                  <Text style={{ color: "#111827", fontSize: 14, fontWeight: "900", marginTop: 2 }}>
                    {activeProduct ? `${activeProduct.qty} pz` : "—"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "800" }}>Total</Text>
                  <Text style={{ color: "#111827", fontSize: 14, fontWeight: "900", marginTop: 2 }}>
                    {activeProduct ? formatMXN(activeProduct.qty * activeProduct.unit) : "—"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}