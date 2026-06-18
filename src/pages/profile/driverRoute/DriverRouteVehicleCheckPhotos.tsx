import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Camera, GasStation, Speedometer } from "iconsax-react-native";
import { TapImagePreview } from "../../../components/TapImagePreview";
import {
  captureDriverRouteVehiclePhoto,
  pickDriverRouteVehiclePhotoFromLibrary,
  type DriverRouteVehiclePhoto,
} from "./captureDriverRouteVehiclePhoto";

export type DriverRouteVehicleCheckPhotosState = {
  odometer: DriverRouteVehiclePhoto | null;
  odometerReading: string;
  fuel: DriverRouteVehiclePhoto | null;
};

export function parseOdometerReading(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function isDriverRouteStartVehicleCheckComplete(
  state: DriverRouteVehicleCheckPhotosState,
): boolean {
  return state.odometer !== null && parseOdometerReading(state.odometerReading) !== null;
}

export function isDriverRouteEndFuelCheckComplete(
  state: DriverRouteVehicleCheckPhotosState,
): boolean {
  return state.fuel !== null;
}

type PhotoSlotKey = "odometer" | "fuel";

type DriverRouteVehicleCheckPhotosProps = {
  photos: DriverRouteVehicleCheckPhotosState;
  onChange: (photos: DriverRouteVehicleCheckPhotosState) => void;
  phase: "start" | "end";
};

export function DriverRouteVehicleCheckPhotos({
  photos,
  onChange,
  phase,
}: DriverRouteVehicleCheckPhotosProps) {
  const [capturing, setCapturing] = useState<PhotoSlotKey | null>(null);
  const [picking, setPicking] = useState<PhotoSlotKey | null>(null);
  const busyRef = useRef(false);

  const applyPhoto = useCallback(
    (key: PhotoSlotKey, photo: DriverRouteVehiclePhoto | null) => {
      if (photo) {
        onChange({ ...photos, [key]: photo });
      }
    },
    [onChange, photos],
  );

  const captureFor = useCallback(
    async (key: PhotoSlotKey) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setCapturing(key);
      try {
        applyPhoto(key, await captureDriverRouteVehiclePhoto());
      } finally {
        busyRef.current = false;
        setCapturing(null);
      }
    },
    [applyPhoto],
  );

  const attachFor = useCallback(
    async (key: PhotoSlotKey) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setPicking(key);
      try {
        applyPhoto(key, await pickDriverRouteVehiclePhotoFromLibrary());
      } finally {
        busyRef.current = false;
        setPicking(null);
      }
    },
    [applyPhoto],
  );

  const clearFor = useCallback(
    (key: PhotoSlotKey) => {
      onChange({ ...photos, [key]: null });
    },
    [onChange, photos],
  );

  const setOdometerReading = useCallback(
    (text: string) => {
      onChange({ ...photos, odometerReading: text });
    },
    [onChange, photos],
  );

  const odometerParsed = parseOdometerReading(photos.odometerReading);
  const odometerReadingInvalid =
    photos.odometerReading.trim().length > 0 && odometerParsed === null;

  const renderPhotoSlot = (
    key: PhotoSlotKey,
    title: string,
    hint: string,
    icon: React.ReactNode,
  ) => {
    const photo = photos[key];
    const loading = capturing === key || picking === key;
    return (
      <View style={styles.slot}>
        <View style={styles.slotHead}>
          {icon}
          <Text style={styles.slotTitle}>{title}</Text>
        </View>
        <Pressable
          style={[styles.photoBtn, photo ? styles.photoBtnDone : null]}
          onPress={() => {
            if (!photo) void captureFor(key);
          }}
          disabled={loading || Boolean(photo)}
          accessibilityLabel={
            photo ? `Foto de ${title} capturada` : `Tomar foto de ${title}`
          }
        >
          {loading ? (
            <ActivityIndicator color="#EA7600" />
          ) : photo ? (
            <TapImagePreview uri={photo.uri}>
              <View style={styles.previewWrap}>
                <Image source={{ uri: photo.uri }} style={styles.preview} />
              </View>
            </TapImagePreview>
          ) : (
            <View style={styles.placeholder}>
              <Camera size={28} color="#64748B" variant="Linear" />
              <Text style={styles.placeholderTxt}>Tomar foto</Text>
            </View>
          )}
        </Pressable>
        <Text style={styles.slotHint}>
          {photo ? "Toca la foto para revisarla" : hint}
        </Text>
        {__DEV__ && !photo ? (
          <Pressable
            style={styles.devAttachBtn}
            onPress={() => void attachFor(key)}
            disabled={loading}
            accessibilityLabel={`Adjuntar foto de ${title} desde galería`}
          >
            <Text style={styles.devAttachTxt}>Adjuntar foto (dev)</Text>
          </Pressable>
        ) : null}
        {photo ? (
          <Pressable
            style={styles.retakeBtn}
            onPress={() => clearFor(key)}
            disabled={loading}
          >
            <Text style={styles.retakeTxt}>Volver a tomar</Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  if (phase === "end") {
    return (
      <View style={styles.wrap}>
        <Text style={styles.sectionTitle}>Combustible al cierre</Text>
        <Text style={styles.sectionHint}>
          Toma una foto del indicador de combustible al terminar la ruta.
        </Text>
        <View style={styles.grid}>
          {renderPhotoSlot(
            "fuel",
            "Combustible",
            "Nivel de gasolina visible",
            <GasStation size={22} color="#EA7600" variant="Bold" />,
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Verificación del vehículo</Text>
      <Text style={styles.sectionHint}>
        Toma una foto del tacómetro y registra el kilometraje antes de iniciar la ruta.
      </Text>
      <View style={styles.grid}>
        {renderPhotoSlot(
          "odometer",
          "Tacómetro",
          "Kilometraje visible",
          <Speedometer size={22} color="#EA7600" variant="Bold" />,
        )}
        <View style={styles.slot}>
          <Text style={styles.inputLbl}>Kilometraje</Text>
          <TextInput
            value={photos.odometerReading}
            onChangeText={setOdometerReading}
            placeholder="Ej. 45230"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={7}
            style={[styles.input, odometerReadingInvalid ? styles.inputWarn : null]}
            accessibilityLabel="Kilometraje del vehículo"
          />
          {odometerReadingInvalid ? (
            <Text style={styles.inputWarnTxt}>Ingresa un kilometraje válido.</Text>
          ) : (
            <Text style={styles.inputHelp}>
              Escribe el kilometraje que muestra el tacómetro.
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionHint: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    lineHeight: 18,
  },
  grid: {
    marginTop: 14,
    gap: 12,
  },
  slot: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  slotHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  photoBtn: {
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  photoBtnDone: {
    borderColor: "#22C55E",
  },
  previewWrap: {
    width: "100%",
    height: "100%",
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholder: {
    alignItems: "center",
    gap: 8,
  },
  placeholderTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  slotHint: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  inputLbl: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  inputWarn: {
    borderColor: "#F97316",
    backgroundColor: "#FFF7ED",
  },
  inputWarnTxt: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#C2410C",
  },
  inputHelp: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  retakeBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  retakeTxt: {
    fontSize: 12,
    fontWeight: "800",
    color: "#EA7600",
  },
  devAttachBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  devAttachTxt: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B45309",
  },
});
