import store, { type AppDispatch } from "../redux/store/store";
import {
  setAttendanceAccess,
  type AttendanceApprovedLeave,
} from "../redux/slices/attendanceAccessSlice";

export const ATTENDANCE_ACCESS_BLOCKED_CODE = "ATTENDANCE_ACCESS_BLOCKED";

export const ATTENDANCE_ACCESS_PUSH_TYPES: ReadonlySet<string> = new Set([
  "ATTENDANCE_ACCESS_CHANGED",
  "LATE_ENTRY_AUTHORIZATION_APPROVED",
  "LATE_ENTRY_AUTHORIZATION_REJECTED",
]);

export type AttendanceAccessPayload = {
  blocked?: boolean;
  message?: string | null;
  restrictsAt?: string | null;
  pendingAuthorization?: boolean;
  leave?: AttendanceApprovedLeave | null;
} | null;

export function applyAttendanceAccess(
  dispatch: AppDispatch,
  payload: AttendanceAccessPayload | undefined,
): void {
  dispatch(
    setAttendanceAccess({
      blocked: Boolean(payload?.blocked),
      message: payload?.message ?? null,
      restrictsAt: payload?.restrictsAt ?? null,
      pendingAuthorization: Boolean(payload?.pendingAuthorization),
      leave: payload?.leave ?? null,
    }),
  );
}

export function isAttendanceAccessBlockedError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === ATTENDANCE_ACCESS_BLOCKED_CODE
  );
}

export function signalAttendanceAccessBlockedIfNeeded(error: unknown): void {
  if (!isAttendanceAccessBlockedError(error)) return;
  if (!store.getState().auth.token) return;
  const message = (error as { message?: unknown }).message;
  const current = store.getState().attendanceAccess;
  store.dispatch(
    setAttendanceAccess({
      ...current,
      blocked: true,
      message: typeof message === "string" ? message : current.message,
      restrictsAt: null,
    }),
  );
}
