import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../redux/store/store";
import { saveInStorage } from "../../../utils";
import { getFile } from "../../../services/s3Service";
import { LOGIN_COPY } from "./constants";
import { fetchLoginWithMockApi } from "./mockLoginApi";
import { persistLoginSession } from "./persistLoginSession";
import { signIn } from "../../../services/authService";

const ERROR_CLEAR_MS = 3000;

/** Flujo de envío: loading, error y orquestación con capa de datos + persistencia. */
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
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await signIn({ email, password });
        console.log(response)
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
