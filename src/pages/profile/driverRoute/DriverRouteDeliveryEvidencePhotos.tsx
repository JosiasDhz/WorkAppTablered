import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Camera, CloseCircle } from "iconsax-react-native";
import {
  captureDriverRouteVehiclePhoto,
  type DriverRouteVehiclePhoto,
} from "./captureDriverRouteVehiclePhoto";

export type DriverRouteDeliveryEvidencePhotosState = DriverRouteVehiclePhoto[];

export function isDriverRouteDeliveryEvidenceComplete(
  photos: DriverRouteDeliveryEvidencePhotosState,
): boolean {
  return photos.length > 0;
}

type DriverRouteDeliveryEvidencePhotosProps = {
  photos: DriverRouteDeliveryEvidencePhotosState;
  onChange: (photos: DriverRouteDeliveryEvidencePhotosState) => void;
};

export function DriverRouteDeliveryEvidencePhotos({
  photos,
  onChange,
}: DriverRouteDeliveryEvidencePhotosProps) {
  const [capturing, setCapturing] = useState(false);
  const busyRef = useRef(false);

  const addPhoto = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setCapturing(true);
    try {
      const photo = await captureDriverRouteVehiclePhoto();
      if (photo) {
        onChange([...photos, photo]);
      }
    } finally {
      busyRef.current = false;
      setCapturing(false);
    }
  }, [onChange, photos]);

  const removePhoto = useCallback(
    (index: number) => {
      onChange(photos.filter((_, i) => i !== index));
    },
    [onChange, photos],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionKicker}>Fotos de entrega</Text>
      <Text style={styles.sectionHint}>
        Agrega una o más fotos como evidencia de la entrega.
      </Text>
      <View style={styles.container}>
        <View style={styles.grid}>
          {photos.map((photo, index) => (
            <View key={`${photo.uri}-${index}`} style={styles.thumbWrap}>
              <Image source={{ uri: photo.uri }} style={styles.thumb} />
              <Pressable
                style={styles.removeBtn}
                onPress={() => removePhoto(index)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Quitar foto"
              >
                <CloseCircle size={22} color="#EF4444" variant="Bold" />
              </Pressable>
            </View>
          ))}
          <Pressable
            style={[styles.addBtn, capturing ? styles.addBtnBusy : null]}
            onPress={() => void addPhoto()}
            disabled={capturing}
            accessibilityRole="button"
            accessibilityLabel="Agregar foto de entrega"
          >
            {capturing ? (
              <ActivityIndicator color="#EA7600" />
            ) : (
              <>
                <Camera size={24} color="#64748B" variant="Linear" />
                <Text style={styles.addTxt}>Agregar foto</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 2,
    marginBottom: 10,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EA7600",
    textTransform: "uppercase",
    letterSpacing: 0.45,
    marginBottom: 8,
  },
  sectionHint: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    lineHeight: 17,
  },
  container: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  thumbWrap: {
    width: 104,
    height: 104,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  thumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 11,
  },
  addBtn: {
    width: 104,
    height: 104,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addBtnBusy: {
    opacity: 0.85,
  },
  addTxt: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 4,
  },
});
