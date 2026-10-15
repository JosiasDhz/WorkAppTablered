import { io, type Socket } from "socket.io-client";
import { apiBaseUrl } from "../../api/http-common";

export const REALTIME_EVENTS = {
  attendanceCheckRegistered: "ATTENDANCE_CHECK_REGISTERED",
  attendanceAccessChanged: "ATTENDANCE_ACCESS_CHANGED",
} as const;

type RealtimeEnvelope = { type?: unknown; data?: unknown };
type RealtimeListener = (data: unknown) => void;
type ConnectionListener = (connected: boolean) => void;

let socket: Socket | null = null;
let sessionUserId: string | null = null;
const listeners = new Map<string, Set<RealtimeListener>>();
const connectionListeners = new Set<ConnectionListener>();

function notifyConnection(connected: boolean) {
  for (const listener of connectionListeners) listener(connected);
}

function dispatchEnvelope(payload: RealtimeEnvelope) {
  if (typeof payload?.type !== "string") return;
  const bucket = listeners.get(payload.type);
  if (!bucket) return;
  for (const listener of bucket) listener(payload.data);
}

export function connectRealtime(userId: string): void {
  if (socket && sessionUserId === userId) return;
  disconnectRealtime();
  sessionUserId = userId;

  const next = io(`${apiBaseUrl.replace(/\/$/, "")}/notificaciones`, {
    path: "/socket.io",
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
  });

  next.on("connect", () => {
    next.emit("joinSession", { userId });
    notifyConnection(true);
  });
  next.on("disconnect", () => notifyConnection(false));
  next.on("notification", dispatchEnvelope);
  socket = next;
}

export function disconnectRealtime(): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  sessionUserId = null;
  notifyConnection(false);
}

export function isRealtimeConnected(): boolean {
  return Boolean(socket?.connected);
}

export function subscribeRealtime(
  type: string,
  listener: RealtimeListener,
): () => void {
  const bucket = listeners.get(type) ?? new Set<RealtimeListener>();
  bucket.add(listener);
  listeners.set(type, bucket);
  return () => {
    bucket.delete(listener);
  };
}

export function subscribeRealtimeConnection(
  listener: ConnectionListener,
): () => void {
  connectionListeners.add(listener);
  return () => {
    connectionListeners.delete(listener);
  };
}
