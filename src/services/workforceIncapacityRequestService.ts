import http, { httpFormDataClient } from "../api/http-common";

export type IncapacityRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type IncapacityReasonDto = {
  id: string;
  name: string;
  maxDays: number;
  requiresEvidence: boolean;
};

export type IncapacityRequestFileDto = {
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

export type IncapacityRequestDto = {
  id: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  status: IncapacityRequestStatus;
  reviewReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  reason: IncapacityReasonDto;
  seller: {
    id: string;
    code: string;
    displayName: string;
  };
  warehouse: {
    id: string;
    name: string;
  };
  files: IncapacityRequestFileDto[];
};

export type UploadedFileResponse = {
  id: string;
  name: string;
  extension: string;
  mimetype: string;
};

export async function listIncapacityReasons() {
  const { data } = await http.get<{ total: number; items: IncapacityReasonDto[] }>(
    "/workforce-incapacity-reasons",
  );
  return data.items ?? [];
}

export async function uploadIncapacityEvidenceFile(asset: {
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

export async function createIncapacityRequest(payload: {
  reasonId: string;
  startDate: string;
  endDate: string;
  fileIds?: string[];
}) {
  const { data } = await http.post<IncapacityRequestDto>(
    "/workforce-incapacity-requests",
    payload,
  );
  return data;
}

export async function listMyIncapacityRequests(params?: {
  status?: IncapacityRequestStatus;
  year?: number;
  month?: number;
}) {
  const { data } = await http.get<{ total: number; items: IncapacityRequestDto[] }>(
    "/workforce-incapacity-requests/mine",
    { params },
  );
  return data.items ?? [];
}

export async function getMyIncapacityRequest(id: string) {
  const { data } = await http.get<IncapacityRequestDto>(
    `/workforce-incapacity-requests/mine/${id}`,
  );
  return data;
}
