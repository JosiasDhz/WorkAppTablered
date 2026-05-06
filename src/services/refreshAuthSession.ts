import type { AppDispatch } from "../redux/store/store";
import { applyAuthPayloadToClient } from "../auth/applyAuthPayload";
import { saveInStorage } from "../utils";
import { getFile } from "./s3Service";
import { fetchAuthValidate } from "./authService";

let lastForegroundRefreshMs = 0;
const FOREGROUND_THROTTLE_MS = 90_000;

const deps = { saveInStorage, getFile };

export async function refreshAuthSession(dispatch: AppDispatch): Promise<void> {
  const data = await fetchAuthValidate();
  if (!data?.token || !data?.user) {
    throw new Error("Sesion invalida");
  }
  await applyAuthPayloadToClient(
    { token: data.token, user: data.user },
    dispatch,
    deps,
  );
}

export function refreshAuthSessionOnAppForeground(dispatch: AppDispatch): void {
  const now = Date.now();
  if (now - lastForegroundRefreshMs < FOREGROUND_THROTTLE_MS) {
    return;
  }
  lastForegroundRefreshMs = now;
  refreshAuthSession(dispatch).catch(() => {});
}
