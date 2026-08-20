import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

export const BIOMETRIC_FLAG_KEY = "tablered-biometric-enabled";
const EMAIL_KEY = "tablered-biometric-email";
const PASSWORD_KEY = "tablered-biometric-password";

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export type BiometricKind = "face" | "fingerprint" | "iris" | "none";

export async function getBiometricKind(): Promise<BiometricKind> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (
      types.includes(FAKESECRET_o1p2q3r4s5t6u7v8w9x0)
    ) {
      return "face";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return "fingerprint";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return "iris";
    }
  } catch {
  }
  return "none";
}

export function biometricLabel(kind: BiometricKind): string {
  if (kind === "face") {
    return Platform.OS === "ios" ? "Face ID" : "reconocimiento facial";
  }
  if (kind === "fingerprint") {
    return Platform.OS === "ios" ? "Touch ID" : "huella digital";
  }
  if (kind === "iris") return "iris";
  return Platform.OS === "ios" ? "Face ID" : "biometría";
}

export async function getBiometricAvailability(): Promise<{
  canUse: boolean;
  hasHardware: boolean;
  enrolled: boolean;
  kind: BiometricKind;
  label: string;
}> {
  let hasHardware = false;
  let enrolled = false;
  try {
    hasHardware = await LocalAuthentication.hasHardwareAsync();
    enrolled = hasHardware
      ? await LocalAuthentication.isEnrolledAsync()
      : false;
  } catch {
    hasHardware = false;
    enrolled = false;
  }
  const kind = await getBiometricKind();
  const label = biometricLabel(kind === "none" && hasHardware ? "face" : kind);
  return {
    canUse: hasHardware && enrolled,
    hasHardware,
    enrolled,
    kind,
    label,
  };
}

export async function canUseBiometricLogin(): Promise<boolean> {
  const availability = await getBiometricAvailability();
  return availability.canUse;
}

export async function isBiometricLoginEnabled(): Promise<boolean> {
  try {
    const flag = await AsyncStorage.getItem(BIOMETRIC_FLAG_KEY);
    if (flag !== "1") return false;
    const email = await SecureStore.getItemAsync(EMAIL_KEY, secureOptions);
    const password = await SecureStore.getItemAsync(PASSWORD_KEY, secureOptions);
    return Boolean(email && password);
  } catch {
    return false;
  }
}

export async function authenticateWithBiometrics(
  promptMessage: string,
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "Cancelar",
      disableDeviceFallback: false,
      fallbackLabel: "Usar código",
    });
    return result.success;
  } catch {
    return false;
  }
}

export async function saveBiometricCredentials(
  email: string,
  password: string,
): Promise<void> {
  await SecureStore.setItemAsync(EMAIL_KEY, email.trim(), secureOptions);
  await SecureStore.setItemAsync(PASSWORD_KEY, password, secureOptions);
  await AsyncStorage.setItem(BIOMETRIC_FLAG_KEY, "1");
}

export async function getBiometricCredentials(): Promise<{
  email: string;
  password: string;
} | null> {
  try {
    const email = await SecureStore.getItemAsync(EMAIL_KEY, secureOptions);
    const password = await SecureStore.getItemAsync(PASSWORD_KEY, secureOptions);
    if (!email || !password) return null;
    return { email, password };
  } catch {
    return null;
  }
}

export async function clearBiometricLogin(): Promise<void> {
  await AsyncStorage.removeItem(BIOMETRIC_FLAG_KEY);
  await SecureStore.deleteItemAsync(EMAIL_KEY).catch(() => undefined);
  await SecureStore.deleteItemAsync(PASSWORD_KEY).catch(() => undefined);
}

function alertAsync(
  title: string,
  message: string,
  buttons: {
    text: string;
    style?: "cancel" | "default" | "destructive";
    onPress?: () => void;
  }[],
): Promise<string> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      buttons.map((button) => ({
        ...button,
        onPress: () => {
          button.onPress?.();
          resolve(button.text);
        },
      })),
      { cancelable: false },
    );
  });
}

export async function promptEnableBiometricLogin(input: {
  email: string;
  password: string;
}): Promise<boolean> {
  const availability = await getBiometricAvailability();
  const label = availability.label;

  if (!availability.hasHardware) {
    await alertAsync(
      "Biometría no disponible",
      "Este dispositivo no soporta Face ID ni huella. Podrás entrar con usuario y contraseña.",
      [{ text: "Entendido", style: "default" }],
    );
    return false;
  }

  if (!availability.enrolled) {
    await alertAsync(
      `Configura ${label}`,
      `Activa ${label} en Ajustes del teléfono y vuelve a iniciar sesión para usarlo en Table Red.`,
      [{ text: "Entendido", style: "default" }],
    );
    return false;
  }

  const choice = await alertAsync(
    `¿Usar ${label}?`,
    `La próxima vez podrás entrar a Table Red con ${label} al tocar Ingresar.`,
    [
      { text: "Ahora no", style: "cancel" },
      { text: "Activar", style: "default" },
    ],
  );

  if (choice !== "Activar") return false;

  const confirmed = await authenticateWithBiometrics(
    `Confirma para activar ${label}`,
  );
  if (!confirmed) {
    await alertAsync(
      "No se activó",
      `No se pudo confirmar ${label}. Inténtalo de nuevo en el próximo inicio de sesión.`,
      [{ text: "Entendido", style: "default" }],
    );
    return false;
  }

  await saveBiometricCredentials(input.email, input.password);
  await alertAsync(
    `${label} activado`,
    `Listo. La próxima vez toca Ingresar y usa ${label}.`,
    [{ text: "Continuar", style: "default" }],
  );
  return true;
}

export async function unlockWithBiometrics(): Promise<{
  email: string;
  password: string;
} | null> {
  const enabled = await isBiometricLoginEnabled();
  if (!enabled) return null;

  const availability = await getBiometricAvailability();
  if (!availability.canUse) return null;

  const ok = await authenticateWithBiometrics(
    `Ingresa con ${availability.label}`,
  );
  if (!ok) return null;
  return getBiometricCredentials();
}
