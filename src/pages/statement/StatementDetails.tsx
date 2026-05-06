import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import {
  ArrowLeft,
  DocumentText,
  Calculator,
  MoneyRecive,
  DocumentDownload,
} from "iconsax-react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatementsParamList } from "../../routes/navigators/ParamsListNavigators";

type StatementDetailsRouteProp = RouteProp<
  StatementsParamList,
  "StatementDetails"
>;
type StatementDetailsNavigationProp = NativeStackNavigationProp<
  StatementsParamList,
  "StatementDetails"
>;

export default function StatementDetails() {
  const navigation = useNavigation<StatementDetailsNavigationProp>();
  const route = useRoute<StatementDetailsRouteProp>();
  const { width } = Dimensions.get("window");

  const colors = {
    dorado: "#B8860B",
    azul: "#1C3B57",
    gris: "#4A4A4A",
    hueso: "#F5F5F3",
    amarillo: "#E2B13C",
    azul_acero: "#2E597A",
    arena_clara: "#D9C7A3",
    negro_carbon: "#1A1A1A",
  };

  // Datos de ejemplo para los conceptos
  const conceptos = [
    {
      no: "PRE-2025-1",
      nPres: "01",
      clave: "045-2346",
      concepto:
        "Trazo y nivelación de acuerdo a las líneas de proyecto P.U.O.T.",
      unidad: "M2",
      cantidad: 643,
      pu: 2.0,
      importe: 1286.0,
      avanceFisico: 75,
      avanceImporte: 964.5,
    },
    {
      no: "PRE-2025-2",
      nPres: "02",
      clave: "048-1234",
      concepto: "Excavación en material tipo II hasta 2.00 m de profundidad",
      unidad: "M3",
      cantidad: 120,
      pu: 45.5,
      importe: 5460.0,
      avanceFisico: 60,
      avanceImporte: 3276.0,
    },
    {
      no: "PRE-2025-3",
      nPres: "03",
      clave: "052-7890",
      concepto: "Suministro y colocación de concreto f'c=250 kg/cm²",
      unidad: "M3",
      cantidad: 85,
      pu: 1250.0,
      importe: 106250.0,
      avanceFisico: 40,
      avanceImporte: 42500.0,
    },
  ];

  // Componente para cada concepto
  const ConceptoCard = ({ concepto }: any) => (
    <TouchableOpacity
      style={{
        backgroundColor: colors.hueso,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        shadowColor: colors.negro_carbon,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 1,
        borderColor: colors.arena_clara,
      }}
      onPress={() =>
        navigation.navigate("ConceptStories", {
          conceptoId: concepto.id,
        })
      }
    >
      {/* Header del concepto */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.arena_clara + "60",
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.azul,
              marginBottom: 2,
            }}
          >
            {concepto.no}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: colors.gris,
            }}
          >
            Clave: {concepto.clave}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: colors.azul_acero,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: colors.hueso,
            }}
          >
            N° Pres: {concepto.nPres}
          </Text>
        </View>
      </View>

      {/* Descripción del concepto */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "500",
            color: colors.gris,
            marginBottom: 4,
          }}
        >
          CONCEPTO
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: colors.azul_acero,
            lineHeight: 20,
          }}
        >
          {concepto.concepto}
        </Text>
      </View>

      {/* Grid de información principal */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <View style={{ width: "30%" }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "500",
              color: colors.gris,
              marginBottom: 2,
            }}
          >
            UNIDAD
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.azul_acero,
            }}
          >
            {concepto.unidad}
          </Text>
        </View>

        <View style={{ width: "30%" }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "500",
              color: colors.gris,
              marginBottom: 2,
            }}
          >
            CANTIDAD
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.azul_acero,
            }}
          >
            {concepto.cantidad.toLocaleString()}
          </Text>
        </View>

        <View style={{ width: "30%" }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "500",
              color: colors.gris,
              marginBottom: 2,
            }}
          >
            P.U.
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.azul_acero,
            }}
          >
            ${concepto.pu.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Importe total */}
      <View
        style={{
          backgroundColor: colors.amarillo + "20",
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: colors.amarillo + "40",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: colors.azul_acero,
            }}
          >
            IMPORTE TOTAL
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: colors.azul,
            }}
          >
            $
            {concepto.importe.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>

      {/* Avance */}
      <View>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.azul,
            marginBottom: 8,
          }}
        >
          AVANCE ACUMULADO
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Avance Físico */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.arena_clara + "30",
              borderRadius: 10,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.arena_clara,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "500",
                color: colors.gris,
                marginBottom: 2,
              }}
            >
              FÍSICO
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.azul_acero,
              }}
            >
              {concepto.avanceFisico}%
            </Text>
          </View>

          {/* Avance en Importe */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.dorado + "20",
              borderRadius: 10,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.dorado + "40",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "500",
                color: colors.gris,
                marginBottom: 2,
              }}
            >
              IMPORTE
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: colors.azul,
              }}
            >
              $
              {concepto.avanceImporte.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.azul}
        translucent={false}
      />
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.azul,
        }}
      >
        {/* Header con navegación */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 16,
            backgroundColor: colors.azul,
            shadowColor: colors.negro_carbon,
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: colors.hueso + "20",
              borderRadius: 12,
              padding: 8,
            }}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={colors.hueso} variant="Bold" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.hueso,
              }}
            >
              Comunicado
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: colors.arena_clara,
              }}
            >
              {route.params?.statementId || "COM-2024-001"}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Contenido principal con fondo diferente */}
        <View
          style={{
            flex: 1,
            backgroundColor: colors.hueso,
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingVertical: 20,
              paddingBottom: 100,
            }}
          >
            {/* Título de sección */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.azul_acero,
                    borderRadius: 10,
                    padding: 8,
                    marginRight: 12,
                  }}
                >
                  <DocumentText size={20} color={colors.hueso} variant="Bold" />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: colors.azul,
                    }}
                  >
                    Conceptos del Comunicado
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: colors.gris,
                    }}
                  >
                    {conceptos.length} conceptos registrados
                  </Text>
                </View>
              </View>

              {/* Botón de descarga de minuta */}
              <TouchableOpacity
                style={{
                  backgroundColor: colors.dorado,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  shadowColor: colors.negro_carbon,
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 4,
                  marginLeft: 8,
                }}
                onPress={() => {
                  // Aquí iría la lógica para descargar la minuta
                  console.log("Descargando minuta...");
                }}
              >
                <DocumentDownload size={16} color={colors.hueso} variant="Bold" />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.hueso,
                    marginLeft: 5,
                  }}
                >
                  Descargar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Lista de conceptos */}
            {conceptos.map((concepto, index) => (
              <ConceptoCard key={index} concepto={concepto} />
            ))}
          </ScrollView>
        </View>
        <View className=" absolute left-0 right-0 bottom-0">
          <Image source={require("../../../assets/images/cele_footer.png")} />
        </View>
      </SafeAreaView>
    </>
  );
}
