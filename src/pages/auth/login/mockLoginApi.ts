import type { MockLoginApiResponse } from "./types";

/**
 * Capa de datos sustituible (DIP): aquí irá `signIn` real de `authService`.
 * Solo devuelve datos; no toca Redux ni almacenamiento.
 */
export async function fetchLoginWithMockApi(
  _email: string,
  _password: string,
): Promise<MockLoginApiResponse> {
  return {
    token: "1234567890",
    user: {
      seller: {
        id: "1234567890",
        name: "Miguel",
      },
      avatar: null,
    },
    accessList: [],
  };
}
