import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  SafeAreaView,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import CardDay from "../../components/CardDay";
import { DateInfo } from "../../interfaces/DateInfo";
import { TimeTableProps } from "../../interfaces/DateInfo";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatementsParamList } from "../../routes/navigators/ParamsListNavigators";

type StatementGridNavigationProp = NativeStackNavigationProp<
  StatementsParamList,
  "StatementGrid"
>;

const StatementGrid: React.FC<TimeTableProps> = () => {
  const { width } = Dimensions.get("window");
  const navigation = useNavigation<StatementGridNavigationProp>();

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

  // Estado para datos de comunicados (datos de ejemplo)
  const [comunicados] = useState([
    {
      id: "COM-2024-001",
      estado: "Activo",
      municipio: "Guadalajara",
      tipoContrato: "SUPERVISIÓN",
      siniestro: "N/A",
      dependencia: "SIOP",
      area: "Infraestructura",
      fechaCreacion: "08 Oct 2024",
      prioridad: "Alta",
    },
    {
      id: "COM-2024-002",
      estado: "Pendiente",
      municipio: "Zapopan",
      tipoContrato: "Obra Pública",
      siniestro: "SIN-001",
      dependencia: "SIOP",
      area: "Vialidades",
      fechaCreacion: "09 Oct 2024",
      prioridad: "Media",
    },
    {
      id: "COM-2024-003",
      estado: "Completado",
      municipio: "Tlaquepaque",
      tipoContrato: "Construcción",
      siniestro: "N/A",
      dependencia: "SIOP",
      area: "Edificaciones",
      fechaCreacion: "10 Oct 2024",
      prioridad: "Baja",
    },
  ]);

  const getFormattedDate = (): DateInfo => {
    const daysOfWeek = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];

    const currentDate = new Date();
    const dayOfWeek = daysOfWeek[currentDate.getDay()];
    const dayOfMonth = currentDate.getDate();
    const month = months[currentDate.getMonth()];

    return {
      formattedDate: `${month}, ${dayOfMonth}`,
      dayOfWeek: dayOfWeek,
    };
  };

  // Función para obtener color según el estado
  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "activo":
        return { bg: "#10B981", text: colors.hueso };
      case "pendiente":
        return { bg: colors.amarillo, text: colors.negro_carbon };
      case "completado":
        return { bg: colors.azul_acero, text: colors.hueso };
      default:
        return { bg: colors.gris, text: colors.hueso };
    }
  };

  // Función para obtener color según la prioridad
  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad.toLowerCase()) {
      case "alta":
        return { bg: "#EF4444", text: colors.hueso };
      case "media":
        return { bg: colors.amarillo, text: colors.negro_carbon };
      case "baja":
        return { bg: colors.arena_clara, text: colors.azul };
      default:
        return { bg: colors.gris, text: colors.hueso };
    }
  };

  // Componente para el card de comunicado
  const StatementCard = ({ comunicado }: any) => {
    const estadoColors = getEstadoColor(comunicado.estado);
    const prioridadColors = getPrioridadColor(comunicado.prioridad);

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
        onPress={() =>
          navigation.navigate("StatementDetails", { statementId: "123" })
        }
      >
        {/* Header del Card */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.azul,
            }}
          >
            {comunicado.id}
          </Text>
          <View
            style={{
              backgroundColor: estadoColors.bg,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: estadoColors.text,
                textTransform: "uppercase",
              }}
            >
              {comunicado.estado}
            </Text>
          </View>
        </View>

        {/* Grid de información */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {/* Municipio */}
          <View style={{ width: "48%" }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: colors.gris,
                marginBottom: 2,
              }}
            >
              MUNICIPIO
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.azul_acero,
              }}
            >
              {comunicado.municipio}
            </Text>
          </View>

          {/* Tipo de Contrato */}
          <View style={{ width: "48%" }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: colors.gris,
                marginBottom: 2,
              }}
            >
              TIPO CONTRATO
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.azul_acero,
              }}
            >
              {comunicado.tipoContrato}
            </Text>
          </View>

          {/* Dependencia */}
          <View style={{ width: "48%", marginTop: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: colors.gris,
                marginBottom: 2,
              }}
            >
              DEPENDENCIA
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.azul_acero,
              }}
            >
              {comunicado.dependencia}
            </Text>
          </View>

          {/* Área */}
          <View style={{ width: "48%", marginTop: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: colors.gris,
                marginBottom: 2,
              }}
            >
              ÁREA
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.azul_acero,
              }}
            >
              {comunicado.area}
            </Text>
          </View>
        </View>

        {/* Footer del Card */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.arena_clara + "50",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: colors.gris,
              }}
            >
              {comunicado.fechaCreacion}
            </Text>
            {comunicado.siniestro !== "N/A" && (
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: "#EF4444",
                  marginTop: 2,
                }}
              >
                Siniestro: {comunicado.siniestro}
              </Text>
            )}
          </View>
          <View
            style={{
              backgroundColor: prioridadColors.bg,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: prioridadColors.text,
              }}
            >
              {comunicado.prioridad}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View
        style={{
          alignItems: "center",
          marginTop: 56,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 380,
            minWidth: width * 0.9,
          }}
        >
          {/* Main Card */}
          <View
            style={{
              backgroundColor: colors.hueso,
              borderRadius: 20,
              padding: 20,
              marginTop: 8,
              shadowColor: colors.negro_carbon,
              shadowOffset: {
                width: 0,
                height: 6,
              },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 8,
              borderWidth: 1,
              borderColor: colors.arena_clara,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text
                  style={{
                    fontSize: width < 350 ? 18 : 22,
                    fontWeight: "400",
                    color: colors.azul_acero,
                    lineHeight: width < 350 ? 22 : 28,
                  }}
                >
                  Bienvenido,{" "}
                  <Text
                    style={{
                      fontWeight: "600",
                      color: colors.azul,
                    }}
                  >
                    Homero
                  </Text>
                </Text>
                <View
                  style={{
                    marginTop: 8,
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    backgroundColor: colors.amarillo + "30",
                    borderRadius: 10,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "500",
                      color: colors.azul_acero,
                    }}
                  >
                    Supervisor
                  </Text>
                </View>
              </View>

              {/* Simplified Profile Section */}
              <View
                style={{
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    borderRadius: 32,
                    padding: 3,
                    backgroundColor: colors.arena_clara,
                    shadowColor: colors.gris,
                    shadowOffset: {
                      width: 0,
                      height: 3,
                    },
                    shadowOpacity: 0.2,
                    shadowRadius: 5,
                    elevation: 5,
                  }}
                >
                  <Image
                    style={{
                      borderRadius: 28,
                      width: 56,
                      height: 56,
                      borderWidth: 2,
                      borderColor: colors.dorado,
                    }}
                    source={require("../../../assets/images/profileJos.jpeg")}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Grid de Comunicados */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 16,
          marginTop: 24,
        }}
      >
        {/* Título de la sección */}
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
            Comunicados
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
              {comunicados.length} activos
            </Text>
          </View>
        </View>

        {/* Lista de comunicados */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {comunicados.map((comunicado) => (
            <StatementCard key={comunicado.id} comunicado={comunicado} />
          ))}
        </ScrollView>
      </View>
    </>
  );
};

export default StatementGrid;
