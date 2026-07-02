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

export type WorkerCheckTypeDto = {
  id: string;
  code: string;
  name: string;
};

export type WorkerTodayCheckContext = {
  workDayYmd: string;
  mode: "work_start" | "select_type" | "complete";
  hasWorkStart: boolean;
  workStartType: WorkerCheckTypeDto | null;
  selectableTypes: WorkerCheckTypeDto[];
  todayEvents: MyAttendanceEventDto[];
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
  const params: Record<string, string | number> = {
    rotate: rotate ? 1 : 0,
  };
  if (checkTypeCode?.trim()) {
    params.checkTypeCode = checkTypeCode.trim().toUpperCase();
  }
  const { data } = await http.get<WorkerQrResponse>("/attendance/worker/qr", {
    params,
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
