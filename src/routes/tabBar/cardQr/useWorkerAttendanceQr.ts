import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchWorkerAttendanceQr } from "../../../services/attendanceService";

export type WorkerQrTimeSlice = {
  payload: string;
  secondsLeft: number;
  timerProgress: number;
  cycle: number;
};

type UseWorkerAttendanceQrOptions = {
  checkTypeCode?: string;
  enabled?: boolean;
};

export function useWorkerAttendanceQr({
  checkTypeCode,
  enabled = true,
}: UseWorkerAttendanceQrOptions = {}): WorkerQrTimeSlice {
  const [nonce, setNonce] = useState("");
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [cycle, setCycle] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const refreshAfterExpiryRef = useRef(false);

  const applyTicket = useCallback((n: string, expiresAtIso: string) => {
    const end = new Date(expiresAtIso).getTime();
    setNonce(n);
    setDeadlineMs(end);
    setCycle((c) => c + 1);
    refreshAfterExpiryRef.current = false;
  }, []);

  const load = useCallback(
    async (rotate: boolean) => {
      try {
        const data = await fetchWorkerAttendanceQr(rotate, checkTypeCode);
        if (data?.nonce && data?.expiresAt) {
          applyTicket(data.nonce, data.expiresAt);
        }
      } catch {
        refreshAfterExpiryRef.current = false;
        setNonce("");
        setDeadlineMs(null);
      }
    },
    [applyTicket, checkTypeCode],
  );

  useEffect(() => {
    if (!enabled) {
      setNonce("");
      setDeadlineMs(null);
      return;
    }
    void load(true);
  }, [enabled, load]);

  useEffect(() => {
    const tickId = setInterval(() => setNow(Date.now()), 400);
    return () => clearInterval(tickId);
  }, []);

  useEffect(() => {
    if (!enabled || deadlineMs == null) return;
    if (now < deadlineMs) return;
    if (refreshAfterExpiryRef.current) return;
    refreshAfterExpiryRef.current = true;
    void load(false);
  }, [now, deadlineMs, load, enabled]);

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
    }),
    [nonce, secondsLeft, timerProgress, cycle],
  );
}
