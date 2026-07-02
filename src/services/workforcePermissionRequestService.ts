import http, { httpFormDataClient } from "../api/http-common";

export type PermissionRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PermissionCategory =
  | "ENTRY_UNTIL_NOON"
  | "HOURLY"
  | "FULL_DAY"
  | "SICKNESS"
  | "PERSONAL_ERRAND"
  | "BEREAVEMENT"
  | "VACATION";

export type BereavementRelationship = "PARENT" | "SIBLING" | "PARTNER" | "CHILD";

export type PermissionPolicySnapshot = {
  quarterlyHourAllowance: number;
  quarterlyFullDayCap: number;
  quarterlySicknessDayCap: number;
  quarterlyPersonalErrandDayCap: number;
  annualBereavementDayCap: number;
};

export type PermissionBalanceSnapshot = {
  sellerId: string;
  quarterKey: string;
  yearKey: string;
  policy: PermissionPolicySnapshot;
  hoursUsedQuarter: number;
  hoursRemainingQuarter: number;
  fullDaysUsedQuarter: number;
  fullDaysRemainingQuarter: number;
  sicknessDaysUsedQuarter: number;
  sicknessDaysRemainingQuarter: number;
  personalErrandDaysUsedQuarter: number;
  personalErrandDaysRemainingQuarter: number;
  bereavementDaysUsedYear: number;
  bereavementDaysRemainingYear: number;
};

export type PermissionRequestFileDto = {
  id: string;
  sortOrder: number;
  file: {
    id: string;
    name: string;
    extension: string;
    mimetype: string;
    url?: string | null;
    thumbnailUrl?: string | null;
  };
};

export type PermissionRequestDto = {
  id: string;
  description: string;
  permissionDate: string;
  category: PermissionCategory;
  requestedHours: number | null;
  requestedDays: number;
  includeSundays: boolean;
  bereavementRelationship: BereavementRelationship | null;
  status: PermissionRequestStatus;
  reviewReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  seller: {
    id: string;
    code: string;
    displayName: string;
  };
  warehouse: {
    id: string;
    name: string;
  };
  files: PermissionRequestFileDto[];
};

export type UploadedFileResponse = {
  id: string;
  name: string;
  extension: string;
  mimetype: string;
};

export async function uploadPermissionEvidenceFile(asset: {
  uri: string;
  name: string;
  mimeType: string;
}): Promise<UploadedFileResponse> {
  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType,
  } as unknown as Blob);

  const { data } = await httpFormDataClient.post<UploadedFileResponse>(
    "/files/upload?purpose=evidence",
    formData,
  );
  if (!data?.id) {
    throw new Error("No se recibió el identificador del archivo subido");
  }
  return data;
}

export async function getMyPermissionBalance(quarterKey?: string) {
  const { data } = await http.get<PermissionBalanceSnapshot>(
    "/workforce-permission-requests/balance/mine",
    { params: { quarterKey } },
  );
  return data;
}

export async function createPermissionRequest(payload: {
  description: string;
  permissionDate: string;
  category: PermissionCategory;
  requestedHours?: number;
  requestedDays?: number;
  includeSundays?: boolean;
  bereavementRelationship?: BereavementRelationship;
  fileIds: string[];
}) {
  const { data } = await http.post<PermissionRequestDto>(
    "/workforce-permission-requests",
    payload,
  );
  return data;
}

export async function listMyPermissionRequests(params?: {
  status?: PermissionRequestStatus;
  year?: number;
  month?: number;
}) {
  const { data } = await http.get<{ total: number; items: PermissionRequestDto[] }>(
    "/workforce-permission-requests/mine",
    { params },
  );
  return data.items ?? [];
}

export async function getMyPermissionRequest(id: string) {
  const { data } = await http.get<PermissionRequestDto>(
    `/workforce-permission-requests/mine/${id}`,
  );
  return data;
}

export const PERMISSION_CATEGORY_OPTIONS: Array<{
  value: PermissionCategory;
  label: string;
}> = [
  { value: "ENTRY_UNTIL_NOON", label: "Entrada hasta 12" },
  { value: "HOURLY", label: "Permiso por horas" },
  { value: "FULL_DAY", label: "Día completo" },
  { value: "SICKNESS", label: "Enfermedad (sin IMSS)" },
  { value: "PERSONAL_ERRAND", label: "Trámites personales" },
  { value: "BEREAVEMENT", label: "Fallecimiento familiar" },
  { value: "VACATION", label: "Vacaciones" },
];

export const PERMISSION_CATEGORY_PICKER_OPTIONS = PERMISSION_CATEGORY_OPTIONS.filter(
  (option) => option.value !== "VACATION",
);

export const BEREAVEMENT_RELATIONSHIP_OPTIONS: Array<{
  value: BereavementRelationship;
  label: string;
}> = [
  { value: "PARENT", label: "Padre o madre" },
  { value: "SIBLING", label: "Hermano(a)" },
  { value: "PARTNER", label: "Pareja" },
  { value: "CHILD", label: "Hijo(a)" },
];
