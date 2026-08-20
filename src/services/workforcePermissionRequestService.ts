import http, { httpFormDataClient } from "../api/http-common";

export type PermissionRequestStatus =
  | "PENDING"
  | "PENDING_RH"
  | "PENDING_SUPERVISOR"
  | "APPROVED"
  | "REJECTED";

export type PermissionCategory =
  | "ENTRY_UNTIL_NOON"
  | "HOURLY"
  | "FULL_DAY"
  | "SICKNESS"
  | "PERSONAL"
  | "PERSONAL_ERRAND"
  | "BEREAVEMENT"
  | "VACATION";

export type BereavementRelationship = "PARENT" | "SIBLING" | "PARTNER" | "CHILD";

export type PermissionPolicySnapshot = {
  quarterlySicknessDayCap: number;
  quarterlySicknessImssDayCap: number;
  annualDengueCovidDayCap: number;
  quarterlyPersonalDayCap: number;
  semiannualPersonalErrandDayCap: number;
  annualBereavementDayCap: number;
  personalErrandMaxHours: number;
  personalErrandNoticeWorkingDays: number;
};

export type PermissionBalanceSnapshot = {
  sellerId: string;
  quarterKey: string;
  yearKey: string;
  semesterKey?: string;
  policy: PermissionPolicySnapshot;
  sicknessDaysUsedQuarter: number;
  sicknessDaysRemainingQuarter: number;
  sicknessImssDaysUsedQuarter: number;
  sicknessImssDaysRemainingQuarter: number;
  dengueCovidDaysUsedYear: number;
  dengueCovidDaysRemainingYear: number;
  personalDaysUsedQuarter: number;
  personalDaysRemainingQuarter: number;
  personalErrandDaysUsedSemester: number;
  personalErrandDaysRemainingSemester: number;
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
  workerHasImss?: boolean;
  isDengueCovid?: boolean;
  hasAntibioticPrescription?: boolean;
  restDaysSpecified?: boolean;
  pendingWorkNotes?: string | null;
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
  isDengueCovid?: boolean;
  hasAntibioticPrescription?: boolean;
  restDaysSpecified?: boolean;
  pendingWorkNotes?: string;
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

export function permissionStatusLabel(status: PermissionRequestStatus): string {
  if (status === "APPROVED") return "Autorizado";
  if (status === "REJECTED") return "Rechazado";
  if (status === "PENDING_RH") return "Preautorización RH";
  if (status === "PENDING_SUPERVISOR") return "Pendiente de jefe";
  return "Pendiente";
}

export const PERMISSION_CATEGORY_OPTIONS: Array<{
  value: PermissionCategory;
  label: string;
  group: "paid" | "unpaid";
  payLabel: string;
  flowLabel: string;
}> = [
  {
    value: "SICKNESS",
    label: "Enfermedad",
    group: "paid",
    payLabel: "Apoyo si no hay IMSS",
    flowLabel: "Se envía a tu jefe el mismo día",
  },
  {
    value: "BEREAVEMENT",
    label: "Fallecimiento familiar",
    group: "paid",
    payLabel: "50% salario mín.",
    flowLabel: "RH preautoriza y luego tu jefe",
  },
  {
    value: "PERSONAL",
    label: "Personales",
    group: "unpaid",
    payLabel: "Sin goce",
    flowLabel: "RH preautoriza y luego tu jefe",
  },
  {
    value: "PERSONAL_ERRAND",
    label: "Trámites",
    group: "unpaid",
    payLabel: "Sin goce",
    flowLabel: "RH preautoriza y luego tu jefe",
  },
];

export const PERMISSION_CATEGORY_PICKER_OPTIONS = PERMISSION_CATEGORY_OPTIONS;

export const PERMISSION_CATEGORY_GROUPS: Array<{
  id: "paid" | "unpaid";
  title: string;
}> = [
  { id: "paid", title: "Con apoyo económico" },
  { id: "unpaid", title: "Sin goce" },
];

export const BEREAVEMENT_RELATIONSHIP_OPTIONS: Array<{
  value: BereavementRelationship;
  label: string;
}> = [
  { value: "PARENT", label: "Padre o madre" },
  { value: "SIBLING", label: "Hermano(a)" },
  { value: "PARTNER", label: "Pareja" },
  { value: "CHILD", label: "Hijo(a)" },
];
