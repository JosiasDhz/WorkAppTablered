import http from "../api/http-common";

export type WorkerQrResponse = {
  nonce: string;
  expiresAt: string;
};

export type MyAttendanceEventDto = {
  id: string;
  registeredAt: string;
  warehouseName: string;
  isExtra: boolean;
  checkType: {
    id: string;
    code: string;
    name: string;
  } | null;
};

export async function fetchWorkerAttendanceQr(rotate: boolean) {
  const { data } = await http.get<WorkerQrResponse>("/attendance/worker/qr", {
    params: { rotate: rotate ? 1 : 0 },
  });
  return data;
}

export async function fetchMyAttendanceEvents(year: number, month: number) {
  const { data } = await http.get<{ events: MyAttendanceEventDto[] }>(
    "/attendance/worker/events",
    { params: { year, month } },
  );
  return data.events ?? [];
}
