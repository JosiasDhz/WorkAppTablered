import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchWorkerAttendanceQr,
  fetchWorkerTodayCheckContext,
  type MyAttendanceEventDto,
  type WorkerCheckTypeDto,
  type WorkerTodayCheckContext,
} from "../../../services/attendanceService";

const CONTEXT_POLL_MS = 1000;
const SUCCESS_FLASH_MS = 2400;
const QR_WINDOW_MS = 30_000;

export type WorkerQrCheckSuccess = {
  id: string;
  warehouseName: string;
  registeredAt: string;
};

export type WorkerQrTimeSlice = {
  payload: string;
  secondsLeft: number;
  timerProgress: number;
  cycle: number;
  context: WorkerTodayCheckContext | null;
  contextLoading: boolean;
  contextError: string | null;
  selectedCheckTypeCode: string | null;
  setSelectedCheckTypeCode: (code: string | null) => void;
  checkTypeOptions: WorkerCheckTypeDto[];
  refreshContext: () => Promise<void>;
  checkSuccess: WorkerQrCheckSuccess | null;
};

function toSuccessEvent(event: MyAttendanceEventDto): WorkerQrCheckSuccess {
  return {
    id: event.id,
    warehouseName: event.warehouseName?.trim() || "Sucursal",
    registeredAt: event.registeredAt,
  };
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
  const [checkSuccess, setCheckSuccess] = useState<WorkerQrCheckSuccess | null>(
    null,
  );

  const refreshAfterExpiryRef = useRef(false);
  const selectedRef = useRef<string | null>(null);
  const knownEventIdsRef = useRef<Set<string> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bootstrappedQrRef = useRef(false);
  const lastTypeForQrRef = useRef<string | undefined>(undefined);
  const rotatingAfterSuccessRef = useRef(false);

  selectedRef.current = selectedCheckTypeCode;

  const checkTypeOptions = useMemo(() => {
    if (!context) return [];
    return context.selectableTypes;
  }, [context]);

  const effectiveCheckTypeCode = useMemo(() => {
    if (!context || !selectedCheckTypeCode) return undefined;
    const allowed = context.selectableTypes.some(
      (row) => row.code === selectedCheckTypeCode,
    );
    return allowed ? selectedCheckTypeCode : undefined;
  }, [context, selectedCheckTypeCode]);

  const applyTicket = useCallback((n: string, expiresAtIso: string) => {
    setNonce(n);
    setDeadlineMs(new Date(expiresAtIso).getTime());
    setCycle((c) => c + 1);
    refreshAfterExpiryRef.current = false;
  }, []);

  const loadQr = useCallback(
    async (checkTypeCode?: string | null) => {
      try {
        const data = await fetchWorkerAttendanceQr(
          true,
          checkTypeCode ?? undefined,
        );
        if (data?.nonce && data?.expiresAt) {
          applyTicket(data.nonce, data.expiresAt);
          return true;
        }
      } catch {
        /* keep previous qr if refresh fails */
      }
      refreshAfterExpiryRef.current = false;
      return false;
    },
    [applyTicket],
  );

  const clearSuccessTimer = useCallback(() => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }, []);

  const handleNewCheck = useCallback(
    (event: MyAttendanceEventDto) => {
      if (rotatingAfterSuccessRef.current) return;
      rotatingAfterSuccessRef.current = true;
      clearSuccessTimer();
      setCheckSuccess(toSuccessEvent(event));
      setNonce("");
      setDeadlineMs(null);

      successTimerRef.current = setTimeout(() => {
        void (async () => {
          let typeCode: string | null = selectedRef.current;
          try {
            const data = await fetchWorkerTodayCheckContext();
            setContext(data);
            const ids = data.todayEvents.map((row) => row.id).filter(Boolean);
            if (knownEventIdsRef.current) {
              for (const id of ids) knownEventIdsRef.current.add(id);
            }
            const stillValid = Boolean(
              typeCode &&
                data.selectableTypes.some((row) => row.code === typeCode),
            );
            if (!stillValid) {
              typeCode = null;
              setSelectedCheckTypeCode(null);
            }
          } catch {
            /* keep previous selection */
          }

          lastTypeForQrRef.current = typeCode ?? undefined;
          await loadQr(typeCode);
          setCheckSuccess(null);
          rotatingAfterSuccessRef.current = false;
          successTimerRef.current = null;
        })();
      }, SUCCESS_FLASH_MS);
    },
    [clearSuccessTimer, loadQr],
  );

  const ingestContext = useCallback(
    (data: WorkerTodayCheckContext) => {
      setContext(data);
      setSelectedCheckTypeCode((prev) => {
        if (prev && data.selectableTypes.some((row) => row.code === prev)) {
          return prev;
        }
        return null;
      });

      const ids = data.todayEvents.map((row) => row.id).filter(Boolean);
      if (knownEventIdsRef.current == null) {
        knownEventIdsRef.current = new Set(ids);
        return;
      }

      const fresh = data.todayEvents.filter(
        (row) => row.id && !knownEventIdsRef.current!.has(row.id),
      );
      for (const id of ids) knownEventIdsRef.current.add(id);

      if (fresh.length > 0) {
        handleNewCheck(fresh[fresh.length - 1]);
      }
    },
    [handleNewCheck],
  );

  const refreshContext = useCallback(async () => {
    setContextLoading(true);
    setContextError(null);
    try {
      const data = await fetchWorkerTodayCheckContext();
      ingestContext(data);
    } catch {
      knownEventIdsRef.current = null;
      bootstrappedQrRef.current = false;
      setContext(null);
      setSelectedCheckTypeCode(null);
      setContextError("No se pudo cargar el estado de chequeo de hoy.");
    } finally {
      setContextLoading(false);
    }
  }, [ingestContext]);

  const syncContextQuiet = useCallback(async () => {
    try {
      const data = await fetchWorkerTodayCheckContext();
      ingestContext(data);
      setContextError(null);
    } catch {
      /* keep last known context */
    }
  }, [ingestContext]);

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  useEffect(() => {
    const id = setInterval(() => {
      void syncContextQuiet();
    }, CONTEXT_POLL_MS);
    return () => clearInterval(id);
  }, [syncContextQuiet]);

  useEffect(() => {
    return () => clearSuccessTimer();
  }, [clearSuccessTimer]);

  useEffect(() => {
    if (contextLoading || !context) return;
    if (checkSuccess) return;
    if (rotatingAfterSuccessRef.current) return;

    const typeKey = effectiveCheckTypeCode ?? "";
    if (!bootstrappedQrRef.current) {
      bootstrappedQrRef.current = true;
      lastTypeForQrRef.current = effectiveCheckTypeCode;
      void loadQr(effectiveCheckTypeCode);
      return;
    }

    if (lastTypeForQrRef.current !== effectiveCheckTypeCode) {
      lastTypeForQrRef.current = effectiveCheckTypeCode;
      void loadQr(effectiveCheckTypeCode);
    }
  }, [
    contextLoading,
    context,
    effectiveCheckTypeCode,
    checkSuccess,
    loadQr,
  ]);

  useEffect(() => {
    const tickId = setInterval(() => setNow(Date.now()), 400);
    return () => clearInterval(tickId);
  }, []);

  useEffect(() => {
    if (checkSuccess) return;
    if (deadlineMs == null) return;
    if (now < deadlineMs) return;
    if (refreshAfterExpiryRef.current) return;
    refreshAfterExpiryRef.current = true;
    void (async () => {
      try {
        const data = await fetchWorkerTodayCheckContext();
        ingestContext(data);
        const nextSelection =
          selectedRef.current &&
          data.selectableTypes.some((row) => row.code === selectedRef.current)
            ? selectedRef.current
            : null;
        setSelectedCheckTypeCode(nextSelection);
        const ok = await loadQr(nextSelection);
        if (!ok) refreshAfterExpiryRef.current = false;
      } catch {
        refreshAfterExpiryRef.current = false;
        setNonce("");
        setDeadlineMs(null);
      }
    })();
  }, [now, deadlineMs, checkSuccess, ingestContext, loadQr]);

  const secondsLeft = useMemo(() => {
    if (deadlineMs == null) return 30;
    const msLeft = Math.max(0, deadlineMs - now);
    return Math.max(1, Math.ceil(msLeft / 1000));
  }, [deadlineMs, now]);

  const timerProgress = useMemo(() => {
    if (deadlineMs == null) return 1;
    const msLeft = Math.max(0, deadlineMs - now);
    return Math.min(1, msLeft / QR_WINDOW_MS);
  }, [deadlineMs, now]);

  return useMemo(
    () => ({
      payload: checkSuccess ? "" : nonce,
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
      checkSuccess,
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
      checkSuccess,
    ],
  );
}
