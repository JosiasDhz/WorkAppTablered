import http from "../api/http-common";

const prefix = "/auth";

export async function fetchAuthValidate() {
  return (await http.get(`${prefix}/validate`)).data;
}

export async function signIn(credentials: any) {
  return (await http.post(`${prefix}/login`, { ...credentials })).data;
}
