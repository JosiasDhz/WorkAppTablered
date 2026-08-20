import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../redux/store/store";
import { saveInStorage } from "../../../utils";
import { getFile } from "../../../services/s3Service";
import {
  isBiometricLoginEnabled,
  promptEnableBiometricLogin,
  saveBiometricCredentials,
} from "../../../services/biometricAuth";
import { LOGIN_COPY } from "./constants";
import { persistLoginSession } from "./persistLoginSession";
import { signIn } from "../../../services/authService";

const ERROR_CLEAR_MS = 3000;

export function useLoginAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), ERROR_CLEAR_MS);
    return () => clearTimeout(t);
  }, [error]);

  const submit = useCallback(
    async (
      email: string,
      password: string,
      options?: { skipBiometricPrompt?: boolean },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await signIn({ email, password });

        if (!options?.skipBiometricPrompt) {
          if (await isBiometricLoginEnabled()) {
            await saveBiometricCredentials(email, password);
          } else {
            await promptEnableBiometricLogin({ email, password });
          }
        }

        await persistLoginSession(response, dispatch, {
          saveInStorage,
          getFile,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : LOGIN_COPY.genericError;
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [dispatch],
  );

  return { loading, error, submit };
}
