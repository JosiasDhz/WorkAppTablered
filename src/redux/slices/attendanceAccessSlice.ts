import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { logout } from "./authSlice";

export type AttendanceApprovedLeave = {
  category: string;
  label: string;
  isVacation: boolean;
  startsOn: string;
  endsOn: string;
};

export type AttendanceAccessState = {
  blocked: boolean;
  message: string | null;
  restrictsAt: string | null;
  pendingAuthorization: boolean;
  leave: AttendanceApprovedLeave | null;
};

const initialState: AttendanceAccessState = {
  blocked: false,
  message: null,
  restrictsAt: null,
  pendingAuthorization: false,
  leave: null,
};

const attendanceAccessSlice = createSlice({
  name: "attendanceAccess",
  initialState,
  reducers: {
    setAttendanceAccess: (
      _state,
      action: PayloadAction<AttendanceAccessState>,
    ) => action.payload,
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const { setAttendanceAccess } = attendanceAccessSlice.actions;

export default attendanceAccessSlice.reducer;
