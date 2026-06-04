import * as ImageManipulator from "expo-image-manipulator";
import { SaveFormat } from "expo-image-manipulator";

function isHeicSource(
  mimeType: string,
  fileName?: string | null,
  uri?: string,
): boolean {
  const mime = (mimeType || "").toLowerCase();
  if (mime === "image/heic" || mime === "image/heif") return true;
  if (fileName && /\.heic$/i.test(fileName)) return true;
  if (fileName && /\.heif$/i.test(fileName)) return true;
  if (uri && /\.heic$/i.test(uri)) return true;
  return false;
}

export async function prepareEvidenceImageForUpload(asset: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}): Promise<{ uri: string; name: string; mimeType: string }> {
  const rawMime = (asset.mimeType || "").toLowerCase();

  if (rawMime === "image/png" || /\.png$/i.test(asset.fileName || "")) {
    return {
      uri: asset.uri,
      name: /\.png$/i.test(asset.fileName || "")
        ? asset.fileName!
        : `evidencia-${Date.now()}.png`,
      mimeType: "image/png",
    };
  }

  const needsNormalize =
    isHeicSource(rawMime, asset.fileName, asset.uri) ||
    rawMime === "image/jpeg" ||
    rawMime === "image/jpg" ||
    /\.jpe?g$/i.test(asset.fileName || "");

  if (needsNormalize) {
    const result = await ImageManipulator.manipulateAsync(asset.uri, [], {
      compress: 0.85,
      format: SaveFormat.JPEG,
    });
    const base =
      asset.fileName?.replace(/\.[^.]+$/i, "").trim() || `evidencia-${Date.now()}`;
    return {
      uri: result.uri,
      name: `${base}.jpg`,
      mimeType: "image/jpeg",
    };
  }

  return {
    uri: asset.uri,
    name: asset.fileName || `evidencia-${Date.now()}.jpg`,
    mimeType: rawMime.startsWith("image/") ? rawMime : "image/jpeg",
  };
}
