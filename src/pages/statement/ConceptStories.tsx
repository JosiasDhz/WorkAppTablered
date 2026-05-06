import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Image,
} from "react-native";
import {
  ArrowLeft,
  DocumentText,
  Add,
  Clock,
  TickSquare,
  MoneyRecive,
  Activity,
} from "iconsax-react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatementsParamList } from "../../routes/navigators/ParamsListNavigators";

type ConceptStoriesRouteProp = RouteProp<
  StatementsParamList,
  "StatementDetails"
>;
type ConceptStoriesNavigationProp = NativeStackNavigationProp<
  StatementsParamList,
  "StatementDetails"
>;

const ConceptStories = () => {
  const navigation = useNavigation<ConceptStoriesNavigationProp>();
  const route = useRoute<ConceptStoriesRouteProp>();
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

  // Datos del concepto principal
  const conceptoInfo = {
    clave: "045-2346",
    descripcion:
      "Trazo y nivelación de acuerdo a las líneas de proyecto",
    pu: 2.0,
    importe: 1286.0,
  };

  // Datos de obras por concepto
  const [obras] = useState([
    {
      id: "OBR-001",
      fecha: "08 Oct 2024",
      descripcion: "Trazo inicial sector norte",
      avanceDinero: 450.0,
      porcentajeTrabajado: 65,
      estatus: "sincronizada",
    },
    {
      id: "OBR-002",
      fecha: "09 Oct 2024",
      descripcion: "Nivelación plataforma principal",
      avanceDinero: 320.5,
      porcentajeTrabajado: 45,
      estatus: "por_sincronizar",
    },
    {
      id: "OBR-003",
      fecha: "10 Oct 2024",
      descripcion: "Verificación de cotas finales",
      avanceDinero: 194.0,
      porcentajeTrabajado: 25,
      estatus: "sincronizada",
    },
  ]);

  // Función para obtener color según el estatus
  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case "sincronizada":
        return { bg: "#10B981", text: colors.hueso, icon: TickSquare };
      case "por_sincronizar":
        return { bg: colors.amarillo, text: colors.negro_carbon, icon: Clock };
      default:
        return { bg: colors.gris, text: colors.hueso, icon: Clock };
    }
  };

  // Componente para el card de información del concepto
  const ConceptoInfoCard = () => (
    <View
      style={{
        backgroundColor: colors.azul_acero,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: colors.negro_carbon,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <View
          style={{
            backgroundColor: colors.dorado,
            borderRadius: 10,
            padding: 8,
            marginRight: 12,
          }}
        >
          <DocumentText size={20} color={colors.azul} variant="Bold" />
        </View>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: colors.hueso,
            flex: 1,
          }}
        >
          Información del Concepto
        </Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "500",
            color: colors.arena_clara,
            marginBottom: 4,
          }}
        >
          CLAVE
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: colors.hueso,
          }}
        >
          {conceptoInfo.clave}
        </Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "500",
            color: colors.arena_clara,
            marginBottom: 4,
          }}
        >
          DESCRIPCIÓN
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: colors.hueso,
            lineHeight: 20,
          }}
        >
          {conceptoInfo.descripcion}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "500",
              color: colors.arena_clara,
              marginBottom: 4,
            }}
          >
            P.U.
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.dorado,
            }}
          >
            ${conceptoInfo.pu.toFixed(2)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "500",
              color: colors.arena_clara,
              marginBottom: 4,
            }}
          >
            IMPORTE TOTAL
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.dorado,
            }}
          >
            $
            {conceptoInfo.importe.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>
    </View>
  );

  // Componente para cada obra
  const ObraCard = ({ obra }: any) => {
    const estatusInfo = getEstatusColor(obra.estatus);
    const IconComponent = estatusInfo.icon;

    return (
      <TouchableOpacity
        style={{
          backgroundColor: colors.hueso,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          shadowColor: colors.negro_carbon,
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 4,
          borderWidth: 1,
          borderColor: colors.arena_clara,
        }}
        activeOpacity={0.7}
      >
        {/* Header de la obra */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
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
              {obra.id}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: colors.gris,
              }}
            >
              {obra.fecha}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: estatusInfo.bg,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <IconComponent size={12} color={estatusInfo.text} variant="Bold" />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: estatusInfo.text,
                textTransform: "capitalize",
              }}
            >
              {obra.estatus === "por_sincronizar"
                ? "Pendiente"
                : "Sincronizada"}
            </Text>
          </View>
        </View>

        {/* Descripción */}
        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "500",
              color: colors.gris,
              marginBottom: 4,
            }}
          >
            DESCRIPCIÓN
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: colors.azul_acero,
              lineHeight: 18,
            }}
          >
            {obra.descripcion}
          </Text>
        </View>

        {/* Grid de avances */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Avance en dinero */}
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <MoneyRecive size={12} color={colors.azul_acero} variant="Bold" />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "500",
                  color: colors.gris,
                  marginLeft: 4,
                }}
              >
                AVANCE $
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: colors.azul,
              }}
            >
              $
              {obra.avanceDinero.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>

          {/* Porcentaje trabajado */}
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <Activity size={12} color={colors.azul_acero} variant="Bold" />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "500",
                  color: colors.gris,
                  marginLeft: 4,
                }}
              >
                TRABAJADO
              </Text>
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.azul_acero,
              }}
            >
              {obra.porcentajeTrabajado}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
              Obras por Concepto
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: colors.arena_clara,
              }}
            >
              {conceptoInfo.clave}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Contenido principal */}
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
            {/* Información del concepto */}
            <ConceptoInfoCard />

            {/* Botón para crear nueva obra */}
            <TouchableOpacity
              onPress={() => navigation.navigate("NewWork")}
              style={{
                backgroundColor: colors.dorado,
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: colors.negro_carbon,
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 6,
              }}
              activeOpacity={0.8}
            >
              <Add size={24} color={colors.hueso} variant="Bold" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.hueso,
                  marginLeft: 8,
                }}
              >
                Nueva Obra
              </Text>
            </TouchableOpacity>

            {/* Título de obras existentes */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.azul,
                }}
              >
                Obras Registradas
              </Text>
              <View
                style={{
                  backgroundColor: colors.amarillo + "30",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.azul_acero,
                  }}
                >
                  {obras.length} obras
                </Text>
              </View>
            </View>

            {/* Lista de obras */}
            {obras.map((obra, index) => (
              <ObraCard key={index} obra={obra} />
            ))}
          </ScrollView>
        </View>
        <View className=" absolute left-0 right-0 bottom-0">
          <Image source={require("../../../assets/images/cele_footer.png")} />
        </View>
      </SafeAreaView>
    </>
  );
};

export default ConceptStories;
