import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchWorkerAttendanceQr,
  fetchWorkerTodayCheckContext,
  type MyAttendanceEventDto,
  type WorkerCheckTypeDto,
  type WorkerTodayCheckContext,
} from "../../../services/attendanceService";

const CONTEXT_POLL_MS = 2000;
const SUCCESS_FLASH_MS = 2400;
const QR_WINDOW_MS = 30_000;
const MIN_TRUSTED_WINDOW_MS = 2_000;
const MAX_TRUSTED_WINDOW_MS = 120_000;
const MIN_ROTATE_INTERVAL_MS = 2_000;
const TICK_GUARD_MS = 15;
const EXPIRED_RETRY_MS = 1000;

export type WorkerQrCheckSuccess = {
  id: string;
  warehouseName: string;
  registeredAt: string;
};

export type WorkerQrTimeSlice = {
  payload: string;
  secondsLeft: number;
  deadlineMs: number | null;
  windowMs: number;
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

export type UseWorkerAttendanceQrOptions = {
  active?: boolean;
};

export function useWorkerAttendanceQr({
  active = true,
}: UseWorkerAttendanceQrOptions = {}): WorkerQrTimeSlice {
  const [context, setContext] = useState<WorkerTodayCheckContext | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const [selectedCheckTypeCode, setSelectedCheckTypeCode] = useState<
    string | null
  >(null);
  const [nonce, setNonce] = useState("");
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [issuedAtMs, setIssuedAtMs] = useState<number | null>(null);
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
  const hasLoadedOnceRef = useRef(false);
  const lastTypeForQrRef = useRef<string | undefined>(undefined);
  const rotatingAfterSuccessRef = useRef(false);
  const lastRotateAtRef = useRef(0);

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
    const receivedAt = Date.now();
    const remainingMs = new Date(expiresAtIso).getTime() - receivedAt;
    const trustsServerWindow =
      Number.isFinite(remainingMs) &&
      remainingMs >= MIN_TRUSTED_WINDOW_MS &&
      remainingMs <= MAX_TRUSTED_WINDOW_MS;

    setNonce(n);
    setIssuedAtMs(receivedAt);
    setDeadlineMs(receivedAt + (trustsServerWindow ? remainingMs : QR_WINDOW_MS));
    setCycle((c) => c + 1);
    lastRotateAtRef.current = receivedAt;
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
      setIssuedAtMs(null);

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
    if (!active) return;
    if (!hasLoadedOnceRef.current) {
      hasLoadedOnceRef.current = true;
      void refreshContext();
      return;
    }
    void syncContextQuiet();
  }, [active, refreshContext, syncContextQuiet]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      void syncContextQuiet();
    }, CONTEXT_POLL_MS);
    return () => clearInterval(id);
  }, [active, syncContextQuiet]);

  useEffect(() => {
    return () => clearSuccessTimer();
  }, [clearSuccessTimer]);

  useEffect(() => {
    if (!active) return;
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
    active,
    contextLoading,
    context,
    effectiveCheckTypeCode,
    checkSuccess,
    loadQr,
  ]);

  useEffect(() => {
    if (!active) return;
    if (deadlineMs == null) {
      setNow(Date.now());
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      const current = Date.now();
      setNow(current);
      const msLeft = deadlineMs - current;
      const nextDelay =
        msLeft > 0 ? msLeft % 1000 || 1000 : EXPIRED_RETRY_MS;
      timeoutId = setTimeout(tick, nextDelay + TICK_GUARD_MS);
    };

    tick();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [active, deadlineMs]);

  useEffect(() => {
    if (!active) return;
    if (checkSuccess) return;
    if (deadlineMs == null) return;
    if (now < deadlineMs) return;
    if (refreshAfterExpiryRef.current) return;
    if (Date.now() - lastRotateAtRef.current < MIN_ROTATE_INTERVAL_MS) return;
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
        setIssuedAtMs(null);
      }
    })();
  }, [active, now, deadlineMs, checkSuccess, ingestContext, loadQr]);

  const secondsLeft = useMemo(() => {
    if (deadlineMs == null) return 30;
    const msLeft = Math.max(0, deadlineMs - now);
    return Math.max(1, Math.ceil(msLeft / 1000));
  }, [deadlineMs, now]);

  const windowMs = useMemo(() => {
    if (deadlineMs == null || issuedAtMs == null) return QR_WINDOW_MS;
    return Math.max(1000, deadlineMs - issuedAtMs);
  }, [deadlineMs, issuedAtMs]);

  return useMemo(
    () => ({
      payload: checkSuccess ? "" : nonce,
      secondsLeft,
      deadlineMs,
      windowMs,
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
      deadlineMs,
      windowMs,
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
