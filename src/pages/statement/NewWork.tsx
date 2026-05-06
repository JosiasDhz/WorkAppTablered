import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  TextInput,
  Alert,
  Image,
} from "react-native";
import {
  ArrowLeft,
  MoneyRecive,
  Activity,
  DocumentText,
  Camera,
  AttachSquare,
  Save2,
  Chart,
} from "iconsax-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatementsParamList } from "../../routes/navigators/ParamsListNavigators";

type NewWorkNavigationProp = NativeStackNavigationProp<
  StatementsParamList,
  "StatementDetails"
>;

export default function NewWork() {
  const navigation = useNavigation<NewWorkNavigationProp>();
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

  // Estado del formulario
  const [formData, setFormData] = useState({
    progresoDinero: "",
    progresoPorcentaje: "",
    estatusGeneral: "",
    problematica: "",
    maquinaria: "",
    equipoSeguridad: "",
    personal: "",
    evidencias: [] as string[],
  });

  const [loading, setLoading] = useState(false);

  // Función para manejar cambios en los inputs
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Función para agregar evidencia
  const handleAddEvidence = () => {
    if (formData.evidencias.length >= 10) {
      Alert.alert("Límite alcanzado", "Máximo 10 archivos de evidencia");
      return;
    }
    // Aquí iría la lógica del image picker
    Alert.alert(
      "Agregar evidencia",
      "Funcionalidad de cámara/galería próximamente"
    );
  };

  // Función para guardar
  const handleSave = () => {
    if (!formData.progresoDinero || !formData.progresoPorcentaje) {
      Alert.alert("Error", "Los campos de progreso son obligatorios");
      return;
    }

    setLoading(true);
    // Aquí iría la lógica para guardar
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Éxito", "Obra creada correctamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    }, 1500);
  };

  // Componente para input básico
  const InputField = ({
    icon,
    placeholder,
    value,
    onChangeText,
    keyboardType = "default",
    multiline = false,
  }: any) => (
    <View
      style={{
        backgroundColor: colors.hueso,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: colors.arena_clara,
        shadowColor: colors.negro_carbon,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
        }}
      >
        <View
          style={{
            backgroundColor: colors.arena_clara + "50",
            padding: 8,
            borderRadius: 10,
            marginRight: 12,
            marginTop: multiline ? 4 : 0,
          }}
        >
          {icon}
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gris + "80"}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          textAlignVertical={multiline ? "top" : "center"}
          style={{
            flex: 1,
            fontSize: 16,
            fontWeight: "500",
            color: colors.azul,
            minHeight: multiline ? 80 : 24,
          }}
        />
      </View>
    </View>
  );

  // Componente para el dropzone de evidencias
  const EvidenceDropzone = () => (
    <View
      style={{
        backgroundColor: colors.hueso,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: colors.arena_clara,
        borderStyle: "dashed",
        shadowColor: colors.negro_carbon,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <View
          style={{
            backgroundColor: colors.arena_clara + "50",
            padding: 8,
            borderRadius: 10,
            marginRight: 12,
          }}
        >
          <Camera size={20} color={colors.azul_acero} variant="Bold" />
        </View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: colors.azul,
          }}
        >
          Evidencia Fotográfica
        </Text>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: colors.amarillo + "20",
          borderRadius: 12,
          padding: 16,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.amarillo + "40",
        }}
        onPress={handleAddEvidence}
        activeOpacity={0.7}
      >
        <AttachSquare size={32} color={colors.azul_acero} variant="Bold" />
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.azul_acero,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          Toca para agregar fotos
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "500",
            color: colors.gris,
            marginTop: 4,
            textAlign: "center",
          }}
        >
          Máximo 10 archivos • {formData.evidencias.length}/10 agregados
        </Text>
      </TouchableOpacity>

      {formData.evidencias.length > 0 && (
        <View
          style={{
            marginTop: 12,
            padding: 12,
            backgroundColor: colors.dorado + "10",
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: colors.azul_acero,
            }}
          >
            {formData.evidencias.length} archivo(s) seleccionado(s)
          </Text>
        </View>
      )}
    </View>
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
              Nueva Obra
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: colors.arena_clara,
              }}
            >
              Registro de actividades
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
              paddingBottom: 120,
            }}
          >
            {/* Título de la sección */}
            <View
              style={{
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: colors.azul,
                  marginBottom: 8,
                }}
              >
                Información de la Obra
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.gris,
                }}
              >
                Completa todos los campos obligatorios
              </Text>
            </View>

            {/* Sección de Progreso */}
            <View
              style={{
                backgroundColor: colors.azul_acero + "15",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: colors.azul_acero + "30",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.azul,
                  marginBottom: 16,
                }}
              >
                📊 Progreso de la Obra
              </Text>

              <InputField
                icon={
                  <MoneyRecive
                    size={20}
                    color={colors.azul_acero}
                    variant="Bold"
                  />
                }
                placeholder="Progreso en dinero (ej: 1250.00)"
                value={formData.progresoDinero}
                onChangeText={(text: string) =>
                  handleInputChange("progresoDinero", text)
                }
                keyboardType="numeric"
              />

              <InputField
                icon={
                  <Chart size={20} color={colors.azul_acero} variant="Bold" />
                }
                placeholder="Progreso en porcentaje (ej: 75)"
                value={formData.progresoPorcentaje}
                onChangeText={(text: string) =>
                  handleInputChange("progresoPorcentaje", text)
                }
                keyboardType="numeric"
              />
            </View>

            {/* Sección de Descripción */}
            <View
              style={{
                backgroundColor: colors.amarillo + "15",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: colors.amarillo + "30",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.azul,
                  marginBottom: 16,
                }}
              >
                📝 Descripción del Trabajo
              </Text>

              <InputField
                icon={
                  <DocumentText
                    size={20}
                    color={colors.azul_acero}
                    variant="Bold"
                  />
                }
                placeholder="Describe el estatus general de la obra..."
                value={formData.estatusGeneral}
                onChangeText={(text: string) =>
                  handleInputChange("estatusGeneral", text)
                }
                multiline
              />

              <InputField
                icon={
                  <DocumentText
                    size={20}
                    color={colors.azul_acero}
                    variant="Bold"
                  />
                }
                placeholder="Describe cualquier problemática encontrada..."
                value={formData.problematica}
                onChangeText={(text: string) =>
                  handleInputChange("problematica", text)
                }
                multiline
              />
            </View>

            {/* Sección de Recursos */}
            <View
              style={{
                backgroundColor: colors.dorado + "15",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: colors.dorado + "30",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.azul,
                  marginBottom: 16,
                }}
              >
                🔧 Recursos Utilizados
              </Text>

              <InputField
                icon={
                  <DocumentText
                    size={20}
                    color={colors.azul_acero}
                    variant="Bold"
                  />
                }
                placeholder="Lista la maquinaria utilizada..."
                value={formData.maquinaria}
                onChangeText={(text: string) =>
                  handleInputChange("maquinaria", text)
                }
                multiline
              />

              <InputField
                icon={
                  <DocumentText
                    size={20}
                    color={colors.azul_acero}
                    variant="Bold"
                  />
                }
                placeholder="Describe el equipo de seguridad empleado..."
                value={formData.equipoSeguridad}
                onChangeText={(text: string) =>
                  handleInputChange("equipoSeguridad", text)
                }
                multiline
              />

              <InputField
                icon={
                  <DocumentText
                    size={20}
                    color={colors.azul_acero}
                    variant="Bold"
                  />
                }
                placeholder="Lista el personal involucrado..."
                value={formData.personal}
                onChangeText={(text: string) =>
                  handleInputChange("personal", text)
                }
                multiline
              />
            </View>

            {/* Sección de Evidencia */}
            <View
              style={
                {
                  // backgroundColor: colors.arena_clara + '15',
                  // borderRadius: 16,
                  // padding: 16,
                  // marginBottom: 20,
                  // borderWidth: 1,
                  // borderColor: colors.arena_clara + '50',
                }
              }
            >
              <EvidenceDropzone />
            </View>

            {/* Botón de guardar */}
            <TouchableOpacity
              style={{
                backgroundColor: loading ? colors.gris : colors.dorado,
                borderRadius: 16,
                padding: 18,
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
                marginTop: 10,
              }}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Save2 size={24} color={colors.hueso} variant="Bold" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.hueso,
                  marginLeft: 8,
                }}
              >
                {loading ? "Guardando..." : "Guardar Obra"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        <View className=" absolute left-0 right-0 bottom-0">
          <Image source={require("../../../assets/images/cele_footer.png")} />
        </View>
      </SafeAreaView>
    </>
  );
}
