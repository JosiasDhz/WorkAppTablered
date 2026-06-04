import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Camera, GasStation, Speedometer } from "iconsax-react-native";
import {
  captureDriverRouteVehiclePhoto,
  pickDriverRouteVehiclePhotoFromLibrary,
  type DriverRouteVehiclePhoto,
} from "./captureDriverRouteVehiclePhoto";

export type DriverRouteVehicleCheckPhotosState = {
  odometer: DriverRouteVehiclePhoto | null;
  fuel: DriverRouteVehiclePhoto | null;
};

export function isDriverRouteVehicleCheckComplete(
  photos: DriverRouteVehicleCheckPhotosState,
): boolean {
  return photos.odometer !== null && photos.fuel !== null;
}

type SlotKey = keyof DriverRouteVehicleCheckPhotosState;

const SLOTS: {
  key: SlotKey;
  title: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "odometer",
    title: "Tacómetro",
    hint: "Kilometraje visible",
    icon: <Speedometer size={22} color="#EA7600" variant="Bold" />,
  },
  {
    key: "fuel",
    title: "Combustible",
    hint: "Nivel de gasolina visible",
    icon: <GasStation size={22} color="#EA7600" variant="Bold" />,
  },
];

type DriverRouteVehicleCheckPhotosProps = {
  photos: DriverRouteVehicleCheckPhotosState;
  onChange: (photos: DriverRouteVehicleCheckPhotosState) => void;
};

export function DriverRouteVehicleCheckPhotos({
  photos,
  onChange,
}: DriverRouteVehicleCheckPhotosProps) {
  const [capturing, setCapturing] = useState<SlotKey | null>(null);
  const [picking, setPicking] = useState<SlotKey | null>(null);
  const busyRef = useRef(false);

  const applyPhoto = useCallback(
    (key: SlotKey, photo: DriverRouteVehiclePhoto | null) => {
      if (photo) {
        onChange({ ...photos, [key]: photo });
      }
    },
    [onChange, photos],
  );

  const captureFor = useCallback(
    async (key: SlotKey) => {
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
    async (key: SlotKey) => {
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
    (key: SlotKey) => {
      onChange({ ...photos, [key]: null });
    },
    [onChange, photos],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Verificación del vehículo</Text>
      <Text style={styles.sectionHint}>
        Toma una foto del tacómetro y del indicador de combustible antes de iniciar la ruta.
      </Text>
      <View style={styles.grid}>
        {SLOTS.map((slot) => {
          const photo = photos[slot.key];
          const loading = capturing === slot.key || picking === slot.key;
          return (
            <View key={slot.key} style={styles.slot}>
              <View style={styles.slotHead}>
                {slot.icon}
                <Text style={styles.slotTitle}>{slot.title}</Text>
              </View>
              <Pressable
                style={[styles.photoBtn, photo ? styles.photoBtnDone : null]}
                onPress={() => void captureFor(slot.key)}
                disabled={loading}
                accessibilityLabel={`Tomar foto de ${slot.title}`}
              >
                {loading ? (
                  <ActivityIndicator color="#EA7600" />
                ) : photo ? (
                  <Image source={{ uri: photo.uri }} style={styles.preview} />
                ) : (
                  <View style={styles.placeholder}>
                    <Camera size={28} color="#64748B" variant="Linear" />
                    <Text style={styles.placeholderTxt}>Tomar foto</Text>
                  </View>
                )}
              </Pressable>
              <Text style={styles.slotHint}>{photo ? "Foto capturada" : slot.hint}</Text>
              {__DEV__ && !photo ? (
                <Pressable
                  style={styles.devAttachBtn}
                  onPress={() => void attachFor(slot.key)}
                  disabled={loading}
                  accessibilityLabel={`Adjuntar foto de ${slot.title} desde galería`}
                >
                  <Text style={styles.devAttachTxt}>Adjuntar foto (dev)</Text>
                </Pressable>
              ) : null}
              {photo ? (
                <Pressable
                  style={styles.retakeBtn}
                  onPress={() => clearFor(slot.key)}
                  disabled={loading}
                >
                  <Text style={styles.retakeTxt}>Volver a tomar</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
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
  preview: {
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
