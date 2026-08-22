import http from "../api/http-common";

const prefix = "/workforce-immediate-supervisors";

export async function authorizeLateEntry(payload: {
  sellerId: string;
  workDayYmd?: string;
}) {
  const { data } = await http.post(`${prefix}/my/late-entry-authorizations`, {
    sellerId: payload.sellerId,
    workDayYmd: payload.workDayYmd,
  });
  return data;
}

export async function rejectLateEntry(payload: {
  sellerId: string;
  workDayYmd?: string;
}) {
  const { data } = await http.post(`${prefix}/my/late-entry-rejections`, {
    sellerId: payload.sellerId,
    workDayYmd: payload.workDayYmd,
  });
  return data;
}
