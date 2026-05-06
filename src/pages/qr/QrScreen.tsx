import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Platform,
  Dimensions,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import QRCode from "react-native-qrcode-svg";
import { getFormattedDate } from "../../utils/DateUtils";
import { fetchLocationAndMunicipio } from "./components/LocationService";
import { Clock, Calendar1 } from "iconsax-react-native";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store/store";
import * as ScreenCapture from "expo-screen-capture";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";

// Colores corporativos Moteros Oaxaca
const COLORS = {
  bg: "#F3F4F6",
  surface: "#FFFFFF",
  white: "#FFFFFF",
  black: "#1D1D1B",
  red: "#E51E2F",
  grayDark: "#111827",
  grayLight: "#6B7280",
  border: "#E5E7EB",
  skeleton: "#E5E7EB",
  skeletonStrong: "#D1D5DB",
};

const formatTimeDisplay = () =>
  new Date()
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    .toUpperCase();

const getBarcodeBars = (value: string) => {
  const source = value || "DEMO-TARJETA";
  return source
    .split("")
    .flatMap((char, index) => {
      const seed = char.charCodeAt(0) + index * 7;
      return [1 + (seed % 3), 1 + ((seed >> 2) % 4)];
    })
    .slice(0, 60);
};

const QrScreen: React.FC = () => {
  const { width } = Dimensions.get("window");
  const { seller } = useSelector((state: RootState) => state.auth);
  const [qrValue, setQrValue] = useState<string>("");
  const [municipio, setMunicipio] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>(formatTimeDisplay);
  const [secondsToExpire, setSecondsToExpire] = useState<number>(15);

  // Función para generar hash del QR
  const generateSecureQRValue = (sellerId: string): string => {
    const now = new Date();
    const hour = now.getHours().toString().padStart(2, "0");
    const minute = now.getMinutes().toString().padStart(2, "0");

    // Formato: M+id+hora+minuto
    const rawData = `.${sellerId}.${hour}.${minute}`;

    // Hashear con SHA256
    // const hashedValue = CryptoJS.SHA256(rawData).toString();

    return rawData;
  };

  // Actualizar hora cada minuto
  useEffect(() => {
    setCurrentTime(formatTimeDisplay());
    const interval = setInterval(
      () => setCurrentTime(formatTimeDisplay()),
      60_000,
    );
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Prevenir capturas de pantalla al montar el componente
    const preventCapture = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch (error) {
        console.log("Error al prevenir captura:", error);
      }
    };

    preventCapture();

    // Permitir capturas al desmontar el componente
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch((error) =>
        console.log("Error al permitir captura:", error),
      );
    };
  }, []);

  // Función para obtener datos de ubicación y generar QR
  const fetchLocationData = async () => {
    console.log(seller?.id);
    if (!seller?.id) {
      setIsLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // const secureQR = generateSecureQRValue(seller.id.toString());
      const secureQR = seller.id;
      console.log({ secureQR });
      setQrValue(secureQR);
      setMunicipio(municipio);
      setIsLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.log("Error fetching location:", error);
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Función para manejar el refresh manual
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLocationData();
  };

  useEffect(() => {
    fetchLocationData();

    return undefined;
  }, [seller]);

  // Cuenta regresiva de expiración (demo): cada 15s se renueva el código
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsToExpire((prev) => {
        if (prev <= 1) {
          fetchLocationData();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seller]);

  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onAutoTabBarScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          alignItems: "center",
          paddingBottom: Math.max(tabBarHeight, 136) + 24,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.red}
            colors={[COLORS.red]}
            // title="Regenerando QR..."
            titleColor={COLORS.black}
          />
        }
      >
        {/* Logo */}
        <View
          style={{
            alignItems: "center",
            paddingTop: Platform.OS === "android" ? 40 : 20,
            paddingBottom: 20,
          }}
        >
          <Image
            source={require("../../../assets/table-red-logo.png")}
            style={{ width: width * 0.4, height: 100 }}
            resizeMode="contain"
          />
        </View>

        {/* Título */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: COLORS.black,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Tu Tarjeta Virtual
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "400",
            color: COLORS.black + "B3",
            marginBottom: 32,
            textAlign: "center",
            paddingHorizontal: 40,
          }}
        >
          Muestra esta tarjeta para identificar tu cuenta y acumular puntos
        </Text>

        {/* Tarjeta Virtual */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 24,
            padding: 18,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: COLORS.black + "10",
            shadowColor: COLORS.black,
            shadowOffset: {
              width: 0,
              height: 8,
            },
            shadowOpacity: 0.12,
            shadowRadius: 18,
            elevation: 8,
            width: width * 0.9,
          }}
        >
          {isLoading ? (
            <View
              style={{
                backgroundColor: COLORS.bg,
                padding: 14,
                borderRadius: 16,
                width: "100%",
                height: 210,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <View
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: COLORS.skeleton,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: COLORS.black + "80",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Generando tarjeta...
                </Text>
              </View>
            </View>
          ) : qrValue ? (
            <View
              style={{
                backgroundColor: "#111827",
                padding: 16,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "#374151",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <View>
                  <Text
                    style={{
                      color: "#9CA3AF",
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    TARJETA DIGITAL
                  </Text>
                  <Text
                    style={{
                      color: COLORS.white,
                      fontSize: 18,
                      fontWeight: "900",
                      marginTop: 2,
                    }}
                  >
                    {seller?.name || "Cliente Table Red"}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "#F59E0B1F",
                    borderWidth: 1,
                    borderColor: "#FBBF24",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                  }}
                >
                  <Text
                    style={{
                      color: "#FCD34D",
                      fontSize: 11,
                      fontWeight: "900",
                    }}
                  >
                    513 PTS
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    gap: 2,
                    height: 82,
                  }}
                >
                  {getBarcodeBars(qrValue).map((bar, index) => (
                    <View
                      // eslint-disable-next-line react/no-array-index-key
                      key={`bar-${index}`}
                      style={{
                        width: bar,
                        height: index % 4 === 0 ? 72 : 62,
                        backgroundColor: "#111827",
                        marginRight: index % 7 === 0 ? 2 : 1,
                      }}
                    />
                  ))}
                </View>
                <Text
                  style={{
                    marginTop: 8,
                    textAlign: "center",
                    color: "#374151",
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1.2,
                  }}
                >
                  {String(qrValue)}
                </Text>
              </View>

              <View
                style={{
                  marginTop: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "700" }}
                >
                  Acerca esto al lector
                </Text>
                <View
                  style={{
                    backgroundColor: "#DC26261A",
                    borderWidth: 1,
                    borderColor: "#FCA5A5",
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      color: "#FCA5A5",
                      fontSize: 12,
                      fontWeight: "900",
                    }}
                  >
                    Caduca en {secondsToExpire}s
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: COLORS.bg,
                padding: 20,
                borderRadius: 16,
                width: "100%",
                height: 220,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <View
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: COLORS.skeleton,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: COLORS.black + "80",
                    fontSize: 14,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Error al generar QR{"\n"}Verifica tu sesión
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Ultimos movimientos (demo) */}
        <View
          style={{
            width: width * 0.9,
            backgroundColor: COLORS.surface,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: COLORS.black + "10",
            padding: 16,
            shadowColor: COLORS.black,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 14,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "900",
              color: COLORS.black,
              marginBottom: 12,
            }}
          >
            Ultimos movimientos
          </Text>

          {[
            {
              id: "m1",
              title: "Compra de MDF 15mm",
              date: "Hoy, 10:34 AM",
              points: "+120 pts",
              color: "#166534",
              bg: "#DCFCE7",
            },
            {
              id: "m2",
              title: "Canje 10% OFF Melamina",
              date: "Ayer, 6:12 PM",
              points: "-80 pts",
              color: "#991B1B",
              bg: "#FEE2E2",
            },
            {
              id: "m3",
              title: "Bono por visita",
              date: "Ayer, 1:05 PM",
              points: "+40 pts",
              color: "#166534",
              bg: "#DCFCE7",
            },
          ].map((movement, index) => (
            <View
              key={movement.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 10,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: COLORS.black + "10",
              }}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: COLORS.black,
                    marginBottom: 2,
                  }}
                  numberOfLines={1}
                >
                  {movement.title}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: COLORS.black + "99",
                  }}
                >
                  {movement.date}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: movement.bg,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "900",
                    color: movement.color,
                  }}
                >
                  {movement.points}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default QrScreen;
