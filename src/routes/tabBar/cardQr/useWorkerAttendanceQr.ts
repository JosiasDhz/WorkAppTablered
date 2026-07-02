import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchWorkerAttendanceQr,
  fetchWorkerTodayCheckContext,
  type WorkerCheckTypeDto,
  type WorkerTodayCheckContext,
} from "../../../services/attendanceService";

export type WorkerQrTimeSlice = {
  payload: string;
  secondsLeft: number;
  timerProgress: number;
  cycle: number;
  context: WorkerTodayCheckContext | null;
  contextLoading: boolean;
  contextError: string | null;
  selectedCheckTypeCode: string | null;
  setSelectedCheckTypeCode: (code: string) => void;
  checkTypeOptions: WorkerCheckTypeDto[];
  refreshContext: () => Promise<void>;
};

function resolveDefaultSelection(
  data: WorkerTodayCheckContext,
  previous: string | null,
): string | null {
  if (data.mode === "work_start") {
    return data.workStartType?.code ?? "TRABAJO_ENTRADA";
  }
  if (data.mode === "select_type") {
    if (previous && data.selectableTypes.some((row) => row.code === previous)) {
      return previous;
    }
    return data.selectableTypes[0]?.code ?? null;
  }
  return null;
}

export function useWorkerAttendanceQr(): WorkerQrTimeSlice {
  const [context, setContext] = useState<WorkerTodayCheckContext | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const [selectedCheckTypeCode, setSelectedCheckTypeCode] = useState<
    string | null
  >(null);
  const [nonce, setNonce] = useState("");
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [cycle, setCycle] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const refreshAfterExpiryRef = useRef(false);
  const selectedRef = useRef<string | null>(null);

  selectedRef.current = selectedCheckTypeCode;

  const checkTypeOptions = useMemo(() => {
    if (!context) return [];
    if (context.mode === "work_start" && context.workStartType) {
      return [context.workStartType];
    }
    if (context.mode === "select_type") {
      return context.selectableTypes;
    }
    return [];
  }, [context]);

  const effectiveCheckTypeCode = useMemo(() => {
    if (!context || context.mode === "complete") return undefined;
    if (context.mode === "work_start") {
      return context.workStartType?.code ?? "TRABAJO_ENTRADA";
    }
    return selectedCheckTypeCode ?? undefined;
  }, [context, selectedCheckTypeCode]);

  const applyTicket = useCallback((n: string, expiresAtIso: string) => {
    const end = new Date(expiresAtIso).getTime();
    setNonce(n);
    setDeadlineMs(end);
    setCycle((c) => c + 1);
    refreshAfterExpiryRef.current = false;
  }, []);

  const refreshContext = useCallback(async () => {
    setContextLoading(true);
    setContextError(null);
    try {
      const data = await fetchWorkerTodayCheckContext();
      setContext(data);
      setSelectedCheckTypeCode((prev) => resolveDefaultSelection(data, prev));
    } catch {
      setContext(null);
      setSelectedCheckTypeCode(null);
      setContextError("No se pudo cargar el estado de chequeo de hoy.");
    } finally {
      setContextLoading(false);
    }
  }, []);

  const loadQr = useCallback(
    async (rotate: boolean) => {
      if (!effectiveCheckTypeCode) {
        setNonce("");
        setDeadlineMs(null);
        return;
      }
      try {
        const data = await fetchWorkerAttendanceQr(
          rotate,
          effectiveCheckTypeCode,
        );
        if (data?.nonce && data?.expiresAt) {
          applyTicket(data.nonce, data.expiresAt);
        }
      } catch {
        refreshAfterExpiryRef.current = false;
        setNonce("");
        setDeadlineMs(null);
      }
    },
    [applyTicket, effectiveCheckTypeCode],
  );

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  useEffect(() => {
    if (contextLoading) return;
    if (context?.mode === "complete") {
      setNonce("");
      setDeadlineMs(null);
      return;
    }
    void loadQr(true);
  }, [contextLoading, context?.mode, effectiveCheckTypeCode, loadQr]);

  useEffect(() => {
    const tickId = setInterval(() => setNow(Date.now()), 400);
    return () => clearInterval(tickId);
  }, []);

  useEffect(() => {
    if (deadlineMs == null) return;
    if (now < deadlineMs) return;
    if (refreshAfterExpiryRef.current) return;
    refreshAfterExpiryRef.current = true;
    void (async () => {
      try {
        const data = await fetchWorkerTodayCheckContext();
        setContext(data);
        const nextSelection = resolveDefaultSelection(
          data,
          selectedRef.current,
        );
        setSelectedCheckTypeCode(nextSelection);
        if (data.mode === "complete" || !nextSelection) {
          setNonce("");
          setDeadlineMs(null);
          refreshAfterExpiryRef.current = false;
          return;
        }
        const qr = await fetchWorkerAttendanceQr(false, nextSelection);
        if (qr?.nonce && qr?.expiresAt) {
          applyTicket(qr.nonce, qr.expiresAt);
        } else {
          refreshAfterExpiryRef.current = false;
        }
      } catch {
        refreshAfterExpiryRef.current = false;
        setNonce("");
        setDeadlineMs(null);
      }
    })();
  }, [now, deadlineMs, applyTicket]);

  const WINDOW_MS = 30_000;

  const secondsLeft = useMemo(() => {
    if (deadlineMs == null) return 30;
    const msLeft = Math.max(0, deadlineMs - now);
    return Math.max(1, Math.ceil(msLeft / 1000));
  }, [deadlineMs, now]);

  const timerProgress = useMemo(() => {
    if (deadlineMs == null) return 1;
    const msLeft = Math.max(0, deadlineMs - now);
    return Math.min(1, msLeft / WINDOW_MS);
  }, [deadlineMs, now]);

  return useMemo(
    () => ({
      payload: nonce,
      secondsLeft,
      timerProgress,
      cycle,
      context,
      contextLoading,
      contextError,
      selectedCheckTypeCode,
      setSelectedCheckTypeCode,
      checkTypeOptions,
      refreshContext,
    }),
    [
      nonce,
      secondsLeft,
      timerProgress,
      cycle,
      context,
      contextLoading,
      contextError,
      selectedCheckTypeCode,
      checkTypeOptions,
      refreshContext,
    ],
  );
}
