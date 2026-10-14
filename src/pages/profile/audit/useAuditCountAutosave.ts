import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import type { AuditCountLinePayload } from "../../../services/inventoryAuditService";

export type AutoSaveState = "idle" | "pending" | "saving" | "saved" | "error";

type PendingPatch = Partial<Omit<AuditCountLinePayload, "id">>;

export function useAuditCountAutosave({
  save,
  enabled,
  delayMs = 900,
}: {
  save: (lines: AuditCountLinePayload[]) => Promise<void>;
  enabled: boolean;
  delayMs?: number;
}) {
  const pendingRef = useRef<Record<string, AuditCountLinePayload>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const saveRef = useRef(save);
  const enabledRef = useRef(enabled);
  const [state, setState] = useState<AutoSaveState>("idle");

  useEffect(() => {
    saveRef.current = save;
    enabledRef.current = enabled;
  }, [save, enabled]);

  const clearTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const hasPending = useCallback(() => Object.keys(pendingRef.current).length > 0, []);

  const sendPending = useCallback(async (): Promise<boolean> => {
    const batch = Object.values(pendingRef.current);
    if (batch.length === 0) return true;
    if (!enabledRef.current) return false;
    setState("saving");
    try {
      await saveRef.current(batch);
      for (const sent of batch) {
        const current = pendingRef.current[sent.id];
        if (
          current &&
          current.counted === sent.counted &&
          current.productionYear === sent.productionYear
        ) {
          delete pendingRef.current[sent.id];
        }
      }
      setState(Object.keys(pendingRef.current).length > 0 ? "pending" : "saved");
      return true;
    } catch {
      setState("error");
      return false;
    }
  }, []);

  const flush = useCallback((): Promise<boolean> => {
    clearTimer();
    queueRef.current = queueRef.current.then(sendPending, sendPending);
    return queueRef.current;
  }, [clearTimer, sendPending]);

  const updateLine = useCallback(
    (id: string, patch: PendingPatch) => {
      const next: AuditCountLinePayload = { ...pendingRef.current[id], ...patch, id };
      if (next.counted === undefined && next.productionYear === undefined) {
        delete pendingRef.current[id];
      } else {
        pendingRef.current[id] = next;
      }
      clearTimer();
      if (!hasPending()) {
        setState((prev) => (prev === "pending" ? "idle" : prev));
        return;
      }
      setState("pending");
      timerRef.current = setTimeout(() => {
        void flush();
      }, delayMs);
    },
    [clearTimer, delayMs, flush, hasPending],
  );

  const discard = useCallback(() => {
    clearTimer();
    pendingRef.current = {};
    setState("idle");
  }, [clearTimer]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active" && hasPending()) void flush();
    });
    return () => sub.remove();
  }, [flush, hasPending]);

  useEffect(() => clearTimer, [clearTimer]);

  return { state, updateLine, flush, hasPending, discard };
}
