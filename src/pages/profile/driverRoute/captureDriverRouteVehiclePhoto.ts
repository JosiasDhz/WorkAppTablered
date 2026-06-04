import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { prepareEvidenceImageForUpload } from "../../../utils/prepareEvidenceImageForUpload";

export type DriverRouteVehiclePhoto = {
  uri: string;
  name: string;
  mimeType: string;
};

async function vehiclePhotoFromAsset(
  asset: ImagePicker.ImagePickerAsset,
): Promise<DriverRouteVehiclePhoto | null> {
  try {
    const prepared = await prepareEvidenceImageForUpload({
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
    });
    return {
      uri: prepared.uri,
      name: prepared.name,
      mimeType: prepared.mimeType,
    };
  } catch {
    Alert.alert(
      "No se pudo procesar la imagen",
      "Intenta tomar la foto de nuevo.",
    );
    return null;
  }
}

export async function captureDriverRouteVehiclePhoto(): Promise<DriverRouteVehiclePhoto | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      "Permiso requerido",
      "Activa la cámara para tomar la foto del vehículo.",
    );
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  return vehiclePhotoFromAsset(result.assets[0]);
}

export async function pickDriverRouteVehiclePhotoFromLibrary(): Promise<DriverRouteVehiclePhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      "Permiso requerido",
      "Activa el acceso a la galería para adjuntar imágenes.",
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  return vehiclePhotoFromAsset(result.assets[0]);
}
