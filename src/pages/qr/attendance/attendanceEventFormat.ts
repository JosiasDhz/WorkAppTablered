import type { MyAttendanceEventDto } from "../../../services/attendanceService";

export function formatEventTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    .toUpperCase();
}

export function describeEventType(event: MyAttendanceEventDto): string {
  const type = event.checkType?.name?.trim();
  if (type) return type;
  return event.isExtra ? "Chequeo extra" : "Chequeo";
}

export function describeEventPlace(event: MyAttendanceEventDto): string {
  return event.warehouseName?.trim() || "Sucursal";
}
