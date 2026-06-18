import http from "../api/http-common";

export type WorkerQrResponse = {
  nonce: string;
  expiresAt: string;
  checkTypeCode?: string | null;
};

export type AttendanceCheckTypeOption = {
  id: string;
  code: string;
  name: string;
};

export type WorkerTodayCheckContext = {
  workDayYmd: string;
  mode: "work_start" | "select_type" | "complete";
  hasWorkStart: boolean;
  workStartType: AttendanceCheckTypeOption | null;
  selectableTypes: AttendanceCheckTypeOption[];
  todayEvents: MyAttendanceEventDto[];
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

export async function fetchWorkerTodayCheckContext() {
  const { data } = await http.get<WorkerTodayCheckContext>(
    "/attendance/worker/today",
  );
  return data;
}

export async function fetchWorkerAttendanceQr(
  rotate: boolean,
  checkTypeCode?: string,
) {
  const { data } = await http.get<WorkerQrResponse>("/attendance/worker/qr", {
    params: {
      rotate: rotate ? 1 : 0,
      ...(checkTypeCode ? { checkTypeCode } : {}),
    },
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
