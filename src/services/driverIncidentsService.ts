import http, { httpFormDataClient } from "../api/http-common";
import type {
  ConfirmDriverRouteReceiptPayload,
  CreateDriverIncidentPayload,
} from "../types/driverIncidents";

const prefix = "/driver-incidents";

export async function confirmDriverRouteReceipt(
  routeId: string,
  payload: ConfirmDriverRouteReceiptPayload,
) {
  const { data } = await http.post(`${prefix}/routes/${routeId}/receipt`, payload);
  return data as {
    routeId: string;
    confirmedCount: number;
    incidentIds: string[];
    incidentCount: number;
  };
}

export async function createDriverIncident(payload: CreateDriverIncidentPayload) {
  const { data } = await http.post(prefix, payload);
  return data;
}

export async function uploadDriverIncidentEvidence(file: {
  uri: string;
  name?: string;
  type?: string;
}): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name ?? "evidencia.jpg",
    type: file.type ?? "image/jpeg",
  } as unknown as Blob);
  const { data } = await httpFormDataClient.post<{ id: string }>(
    "/files/upload?purpose=evidence",
    formData,
  );
  return data;
}
