import http, { httpFormDataClient } from "../api/http-common";

export type AttendanceNoticeType = "EXPECTED_LATE" | "WONT_CHECK_IN";

export type AttendanceNoticeDto = {
  id: string;
  workDate: string;
  noticeType: AttendanceNoticeType;
  noticeTypeLabel: string;
  description: string;
  evidenceFileId: string;
  createdAt: string;
  seller: {
    id: string;
    code: string;
  };
  warehouse: {
    id: string;
    name: string;
  };
};

export type UploadedFileResponse = {
  id: string;
  name: string;
  extension: string;
  mimetype: string;
};

export const ATTENDANCE_NOTICE_TYPE_OPTIONS: Array<{
  value: AttendanceNoticeType;
  label: string;
}> = [
  { value: "EXPECTED_LATE", label: "Llegaré tarde" },
  { value: "WONT_CHECK_IN", label: "No checaré / no asistiré" },
];

export async function uploadAttendanceNoticeEvidenceFile(asset: {
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

export async function createAttendanceNotice(payload: {
  noticeType: AttendanceNoticeType;
  description: string;
  evidenceFileId: string;
}) {
  const { data } = await http.post<AttendanceNoticeDto>(
    "/workforce-attendance-notices",
    payload,
  );
  return data;
}

export async function getMyAttendanceNoticeToday() {
  const { data } = await http.get<{ notice: AttendanceNoticeDto | null }>(
    "/workforce-attendance-notices/mine/today",
  );
  return data.notice;
}
