import http, { httpFormDataClient } from "../api/http-common";

export type PermissionRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

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

export async function createPermissionRequest(payload: {
  description: string;
  permissionDate: string;
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
