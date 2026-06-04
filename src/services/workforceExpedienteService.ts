import http, { httpFormDataClient } from "../api/http-common";

export type ExpedienteDocumentSummaryItemDto = {
  documentTypeId: string;
  documentTypeName: string;
  isRequired: boolean;
  sellerDocumentId: string | null;
  fileCount: number;
  uploadedAt: string | null;
  uploadedBy: {
    id: string;
    displayName: string;
  } | null;
};

export type ExpedienteFileRefDto = {
  id: string;
  name: string;
  extension: string;
  mimetype: string;
  url?: string | null;
  thumbnailUrl?: string | null;
};

export type ExpedienteDocumentFileEntryDto = {
  id: string;
  file: ExpedienteFileRefDto;
  uploadedAt: string | null;
  uploadedBy: {
    id: string;
    displayName: string;
  } | null;
};

export type ExpedienteDocumentDetailDto = ExpedienteDocumentSummaryItemDto & {
  files: ExpedienteDocumentFileEntryDto[];
};

export type ExpedienteProfilePhotoDto = {
  id: string;
  url?: string | null;
  thumbnailUrl?: string | null;
};

export type SellerExpedienteDto = {
  sellerId: string;
  sellerCode: string;
  workerName: string;
  workerRoleLabel: string;
  workerEmail?: string | null;
  workerPhone?: string | null;
  profilePhoto?: ExpedienteProfilePhotoDto | null;
  warehouseId: string | null;
  warehouseName: string | null;
  requiredTotal: number;
  requiredUploaded: number;
  optionalTotal: number;
  optionalUploaded: number;
  isComplete: boolean;
  documents: ExpedienteDocumentSummaryItemDto[];
};

const prefix = "/workforce-expediente";

export async function getMyExpediente() {
  const { data } = await http.get<SellerExpedienteDto>(`${prefix}/my`);
  return data;
}

export async function getMyExpedienteDocument(documentTypeId: string) {
  const { data } = await http.get<ExpedienteDocumentDetailDto>(
    `${prefix}/my/documents/${documentTypeId}`,
    { timeout: 45000 },
  );
  return data;
}

export async function uploadExpedienteEvidenceFile(asset: {
  uri: string;
  name: string;
  mimeType: string;
}) {
  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType,
  } as unknown as Blob);

  const { data } = await httpFormDataClient.post<{ id: string }>(
    "/files/upload?purpose=expediente",
    formData,
  );
  if (!data?.id) {
    throw new Error("No se recibió el identificador del archivo subido");
  }
  return data;
}

export async function addMyDocumentFile(documentTypeId: string, fileId: string) {
  const { data } = await http.post<ExpedienteDocumentDetailDto>(
    `${prefix}/my/documents/${documentTypeId}/files`,
    { fileId },
    { timeout: 45000 },
  );
  return data;
}

export async function upsertMyDocument(documentTypeId: string, fileId: string) {
  return addMyDocumentFile(documentTypeId, fileId);
}

export async function removeMyDocumentFile(documentTypeId: string, fileId: string) {
  const { data } = await http.delete<ExpedienteDocumentDetailDto>(
    `${prefix}/my/documents/${documentTypeId}/files/${fileId}`,
    { timeout: 45000 },
  );
  return data;
}
