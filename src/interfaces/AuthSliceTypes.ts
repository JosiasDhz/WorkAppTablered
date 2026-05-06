

export interface IAuthState {
  token: string | null;
  user: any;
  seller: any;
  loading: boolean;
  error: string | null;
  userAvatar: string;
  messageAlreadyFetch: boolean;
}

export const AuthStateDefault: IAuthState = {
  token: "",
  user: {} as any,
  seller: {} as any,
  loading: false,
  error: null,
  userAvatar: "",
  messageAlreadyFetch: false,
};

export interface ILoginAuthSlice {
  token: string;
  user: any;
  seller: any;
  profileUrl: string;
}
