import {
  cacheDirectory,
  deleteAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";

type ParsedSignatureDataUrl = {
  mimeType: string;
  base64: string;
  extension: "png" | "jpg";
};

function parseSignatureDataUrl(dataUrl: string): ParsedSignatureDataUrl | null {
  const trimmed = dataUrl.trim();
  const match = trimmed.match(/^data:(image\/(?:png|jpeg|jpg));base64,(.+)$/i);
  if (!match) return null;
  const mimeType = match[1].toLowerCase().replace("jpg", "jpeg");
  return {
    mimeType,
    base64: match[2],
    extension: mimeType.includes("png") ? "png" : "jpg",
  };
}

export async function prepareSignatureDataUrlForUpload(
  signatureDataUrl: string,
): Promise<{ uri: string; name: string; mimeType: string }> {
  const parsed = parseSignatureDataUrl(signatureDataUrl);
  if (!parsed) {
    throw new Error("Formato de firma no válido");
  }
  const cacheDir = cacheDirectory;
  if (!cacheDir) {
    throw new Error("No hay almacenamiento temporal para la firma");
  }

  const name = `delivery-signature-${Date.now()}.${parsed.extension}`;
  const uri = `${cacheDir}${name}`;
  await writeAsStringAsync(uri, parsed.base64, { encoding: "base64" });

  return {
    uri,
    name,
    mimeType: parsed.mimeType,
  };
}

export async function deletePreparedSignatureUpload(uri: string): Promise<void> {
  const trimmed = String(uri ?? "").trim();
  if (!trimmed) return;
  await deleteAsync(trimmed, { idempotent: true });
}
