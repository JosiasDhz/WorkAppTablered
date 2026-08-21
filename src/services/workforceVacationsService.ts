import http from "../api/http-common";
import {
  createPermissionRequest,
  listMyPermissionRequests,
  getMyPermissionRequest,
  permissionStatusLabel,
  uploadPermissionEvidenceFile,
  type PermissionRequestDto,
  type PermissionRequestStatus,
} from "./workforcePermissionRequestService";

export type VacationBalanceDto = {
  sellerId: string;
  hireDate: string | null;
  serviceYears: number;
  eligible: boolean;
  annualDays: number;
  daysUsed: number;
  daysPending: number;
  daysRemaining: number;
  periodMinDays: number | null;
  periodMaxDays: number | null;
  periodHint: string | null;
  tierId: string | null;
  noticeDays: number;
  minServiceYears: number;
};

export type VacationRequestDto = PermissionRequestDto;
export type VacationRequestStatus = PermissionRequestStatus;

export { permissionStatusLabel, uploadPermissionEvidenceFile };

export async function getMyVacationBalance(date?: string) {
  const { data } = await http.get<VacationBalanceDto>(
    "/workforce-vacations/balance/mine",
    { params: date ? { date } : undefined },
  );
  return data;
}

export async function getVacationPolicy() {
  const { data } = await http.get<{
    vacationNoticeDays: number;
    vacationMinServiceYears: number;
  }>("/workforce-vacations/policy");
  return data;
}

export async function listMyVacationRequests(params?: {
  year?: number;
  month?: number;
}) {
  const items = await listMyPermissionRequests(params);
  return items.filter((item) => item.category === "VACATION");
}

export async function getMyVacationRequest(id: string) {
  return getMyPermissionRequest(id);
}

export async function createVacationRequest(payload: {
  description: string;
  permissionDate: string;
  requestedDays: number;
  fileIds: string[];
}) {
  return createPermissionRequest({
    ...payload,
    category: "VACATION",
  });
}
