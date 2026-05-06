import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchWorkerAttendanceQr } from "../../../services/attendanceService";

export type WorkerQrTimeSlice = {
  payload: string;
  secondsLeft: number;
  timerProgress: number;
  cycle: number;
};

export function useWorkerAttendanceQr(): WorkerQrTimeSlice {
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
        const data = await fetchWorkerAttendanceQr(rotate);
        if (data?.nonce && data?.expiresAt) {
          applyTicket(data.nonce, data.expiresAt);
        }
      } catch {
        refreshAfterExpiryRef.current = false;
        setNonce("");
        setDeadlineMs(null);
      }
    },
    [applyTicket],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    const tickId = setInterval(() => setNow(Date.now()), 400);
    return () => clearInterval(tickId);
  }, []);

  useEffect(() => {
    if (deadlineMs == null) return;
    if (now < deadlineMs) return;
    if (refreshAfterExpiryRef.current) return;
    refreshAfterExpiryRef.current = true;
    void load(false);
  }, [now, deadlineMs, load]);

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
