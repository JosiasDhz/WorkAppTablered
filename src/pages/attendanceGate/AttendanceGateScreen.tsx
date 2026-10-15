import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store/store";
import { AttendanceGateCheckIn } from "./AttendanceGateCheckIn";
import { AttendanceGateLeave } from "./AttendanceGateLeave";

export default function AttendanceGateScreen() {
  const leave = useSelector((state: RootState) => state.attendanceAccess.leave);
  return leave ? <AttendanceGateLeave leave={leave} /> : <AttendanceGateCheckIn />;
}
