import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AuthStateDefault,
  ILoginAuthSlice,
} from "../../interfaces/AuthSliceTypes";

const authSlice = createSlice({
  name: "auth",
  initialState: AuthStateDefault,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.seller = null;
    },

    restoreSesion: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.seller = action.payload.seller;
      state.userAvatar = action.payload.userAvatar;
    },

    login: (state, action: PayloadAction<ILoginAuthSlice>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.seller = action.payload.seller;
      state.userAvatar = action.payload.profileUrl;
    },

    setSessionToken: (state, action: PayloadAction<{ token: string }>) => {
      state.token = action.payload.token;
    },
  },
});

export const { logout, login, restoreSesion, setSessionToken } = authSlice.actions;

export default authSlice.reducer;
