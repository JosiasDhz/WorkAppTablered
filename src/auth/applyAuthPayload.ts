import type { AppDispatch } from "../redux/store/store";
import store from "../redux/store/store";
import { login, setSessionToken } from "../redux/slices/authSlice";
import type { LoginSessionDependencies } from "../pages/auth/login/types";
import { getFromStorage } from "../utils";

export type AuthPayloadInput = {
  token: string;
  user: any;
};

export async function applyAuthPayloadToClient(
  payload: AuthPayloadInput,
  dispatch: AppDispatch,
  deps: LoginSessionDependencies,
): Promise<void> {
  const { token, user: rawUser } = payload;
  if (!token || !rawUser) {
    throw new Error("Sesion invalida");
  }

  let user: any;
  let seller: any;

  if (rawUser.seller && typeof rawUser.seller === "object") {
    const { seller: s, ...u } = rawUser;
    user = u;
    seller = s;
    const oldRaw = await getFromStorage("tablered-seller");
    if (oldRaw) {
      seller = { ...JSON.parse(oldRaw), ...seller };
    }
  } else {
    user = rawUser;
    const oldRaw = await getFromStorage("tablered-seller");
    seller = oldRaw ? JSON.parse(oldRaw) : {};
  }

  let profileUrl = "";
  const avatar =
    user?.avatar &&
    typeof user.avatar === "object" &&
    user.avatar !== null &&
    "id" in user.avatar
      ? (user.avatar as { id: string })
      : null;
  if (avatar?.id) {
    const file = await deps.getFile(avatar.id);
    profileUrl = file?.url ?? "";
  }

  const sellerNorm = seller ?? {};
  const profileUrlNorm = profileUrl ?? "";

  await deps.saveInStorage("tablered-token", token);
  await deps.saveInStorage("tablered-user", JSON.stringify(user));
  await deps.saveInStorage("tablered-seller", JSON.stringify(sellerNorm));

  const cur = store.getState().auth;
  const profileUnchanged =
    cur.userAvatar === profileUrlNorm &&
    JSON.stringify(cur.user) === JSON.stringify(user) &&
    JSON.stringify(cur.seller) === JSON.stringify(sellerNorm);

  if (profileUnchanged) {
    dispatch(setSessionToken({ token }));
    return;
  }

  dispatch(
    login({
      token,
      user,
      seller: sellerNorm,
      profileUrl: profileUrlNorm,
    }),
  );
}
