import { AppState, InteractionManager, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import type { DocumentPickerAsset } from "expo-document-picker";

let pickerLock: Promise<void> = Promise.resolve();

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isPickingInProgressError(err: unknown) {
  const msg = String((err as { message?: string })?.message ?? err).toLowerCase();
  return msg.includes("picking in progress");
}

async function waitForAppActive() {
  if (AppState.currentState === "active") return;
  await new Promise<void>((resolve) => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        sub.remove();
        resolve();
      }
    });
  });
}

function isPdfAsset(asset: DocumentPickerAsset) {
  const mime = (asset.mimeType ?? "").toLowerCase();
  const name = asset.name ?? "";
  return mime.includes("pdf") || name.toLowerCase().endsWith(".pdf");
}

async function runDocumentPicker(multiple: boolean) {
  await waitForAppActive();
  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });

  if (Platform.OS === "ios") {
    await delay(450);
  }

  const attempts = Platform.OS === "ios" ? 6 : 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const type =
        Platform.OS === "ios" && attempt >= 2 ? "*/*" : "application/pdf";
      return await DocumentPicker.getDocumentAsync({
        type,
        copyToCacheDirectory: true,
        multiple,
      });
    } catch (err) {
      lastError = err;
      if (attempt < attempts - 1 && isPickingInProgressError(err)) {
        await delay(500 + attempt * 350);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

async function pickPdfAssets(multiple: boolean): Promise<DocumentPickerAsset[]> {
  const task = async () => runDocumentPicker(multiple);
  const resultPromise = pickerLock.then(task, task);
  pickerLock = resultPromise.then(
    () => undefined,
    () => undefined,
  );

  const result = await resultPromise;
  if (result.canceled || !result.assets?.length) return [];

  const pdfs = result.assets.filter(isPdfAsset);
  if (pdfs.length === 0) {
    throw new Error("Selecciona al menos un archivo en formato PDF.");
  }

  return pdfs;
}

export async function pickPdfDocument(): Promise<DocumentPickerAsset | null> {
  const assets = await pickPdfAssets(false);
  return assets[0] ?? null;
}

export async function pickPdfDocuments(): Promise<DocumentPickerAsset[]> {
  return pickPdfAssets(true);
}

export async function waitAfterImagePickerOnIos() {
  if (Platform.OS === "ios") {
    await delay(700);
  }
}
