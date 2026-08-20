import type { AppDispatch } from "../redux/store/store";
import { restoreSesion } from "../redux/slices/authSlice";
import { getFromStorage } from "../utils";
import { getFile } from "./s3Service";
import { refreshAuthSession } from "./refreshAuthSession";
import { registerExpoPushTokenWithApi } from "./expoPushToken";
import { markHomeWelcomePending } from "../pages/home/homeWelcomePending";

export async function restoreStoredSession(
  dispatch: AppDispatch,
): Promise<boolean> {
  const userSaved = await getFromStorage("tablered-user");
  const sellerSaved = await getFromStorage("tablered-seller");
  const tokenSaved = await getFromStorage("tablered-token");
  if (!userSaved || !tokenSaved) return false;

  const user = JSON.parse(userSaved);
  const seller = sellerSaved ? JSON.parse(sellerSaved) : {};

  markHomeWelcomePending();
  dispatch(
    restoreSesion({
      token: tokenSaved,
      user,
      seller,
      userAvatar: "",
    }),
  );

  try {
    await refreshAuthSession(dispatch);
  } catch {
    if (user?.avatar?.id) {
      try {
        const profileUrl = await getFile(user.avatar.id);
        if (profileUrl?.url) {
          dispatch(
            restoreSesion({
              token: tokenSaved,
              user,
              seller,
              userAvatar: profileUrl.url,
            }),
          );
        }
      } catch {
      }
    }
    void registerExpoPushTokenWithApi();
  }

  return true;
}
