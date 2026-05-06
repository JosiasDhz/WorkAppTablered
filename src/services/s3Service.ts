import http, { httpFormDataClient } from "../api/http-common";

const prefix = "/files";

export async function getFile(name: string) {
  return (await http.get(`${prefix}/${name}`)).data;
}
// export default class S3Service {
//   // static async upload(dataForm, path) {
//   //   const response = await http.post(`${prefix}/upload/${path}`, dataForm, {
//   //     headers: {
//   //       "Content-Type": "multipart/form-data",
//   //     },
//   //   });
//   //   return response.data;
//   // }

//   static async getByID(id: string) {
//     return (await http.get(`${prefix}/getByID/${id}`)).data;
//   }
// }
