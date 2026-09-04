import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Camera, CloseCircle, GalleryImport } from "iconsax-react-native";
import { useDriverUi, type DriverUi } from "./driverUi";
import {
  captureDriverRouteVehiclePhoto,
  pickDriverRouteVehiclePhotoFromLibrary,
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
  const ui = useDriverUi();
  const styles = useMemo(() => createStyles(ui), [ui]);
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

  const pickFromGallery = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setCapturing(true);
    try {
      const photo = await pickDriverRouteVehiclePhotoFromLibrary();
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
                <CloseCircle size={22} color={ui.rose} variant="Bold" />
              </Pressable>
            </View>
          ))}
          <Pressable
            style={[styles.addBtn, capturing ? styles.addBtnBusy : null]}
            onPress={() => void addPhoto()}
            disabled={capturing}
            accessibilityRole="button"
            accessibilityLabel="Tomar foto de entrega"
          >
            {capturing ? (
              <ActivityIndicator color={ui.accent} />
            ) : (
              <>
                <Camera size={24} color={ui.muted} variant="Linear" />
                <Text style={styles.addTxt}>Tomar foto</Text>
              </>
            )}
          </Pressable>
          <Pressable
            style={[styles.addBtn, styles.addBtnGallery, capturing ? styles.addBtnBusy : null]}
            onPress={() => void pickFromGallery()}
            disabled={capturing}
            accessibilityRole="button"
            accessibilityLabel="Adjuntar foto de galería"
          >
            {capturing ? (
              <ActivityIndicator color={ui.accent} />
            ) : (
              <>
                <GalleryImport size={24} color={ui.accent} variant="Linear" />
                <Text style={styles.addTxtGallery}>Adjuntar de galería</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(ui: DriverUi) {
  return StyleSheet.create({
    wrap: {
      marginTop: 2,
      marginBottom: 10,
    },
    sectionKicker: {
      fontSize: 11,
      fontWeight: "800",
      color: ui.accent,
      textTransform: "uppercase",
      letterSpacing: 0.45,
      marginBottom: 8,
    },
    sectionHint: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: "600",
      color: ui.muted,
      lineHeight: 17,
    },
    container: {
      marginTop: 10,
      backgroundColor: ui.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: ui.border,
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
      backgroundColor: ui.surface,
      borderRadius: 11,
    },
    addBtn: {
      width: 104,
      height: 104,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: ui.border,
      borderStyle: "dashed",
      backgroundColor: ui.field,
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
      color: ui.muted,
      textAlign: "center",
      paddingHorizontal: 4,
    },
    addBtnGallery: {
      borderColor: ui.accentBorder,
      backgroundColor: ui.accentSoft,
    },
    addTxtGallery: {
      marginTop: 4,
      fontSize: 10,
      fontWeight: "700",
      color: ui.accent,
      textAlign: "center",
      paddingHorizontal: 4,
    },
  });
}
