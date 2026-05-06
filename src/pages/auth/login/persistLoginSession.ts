import type { AppDispatch } from "../../../redux/store/store";
import type { LoginSessionDependencies, MockLoginApiResponse } from "./types";
import { applyAuthPayloadToClient } from "../../../auth/applyAuthPayload";

export async function persistLoginSession(
  loginResponse: MockLoginApiResponse,
  dispatch: AppDispatch,
  deps: LoginSessionDependencies,
): Promise<void> {
  if (!loginResponse?.token || !loginResponse?.user?.seller) {
    throw new Error("Ocurrio un error, intentelo mas tarde");
  }

  await applyAuthPayloadToClient(
    { token: loginResponse.token, user: loginResponse.user },
    dispatch,
    deps,
  );
}
