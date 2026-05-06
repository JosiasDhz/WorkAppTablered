import { useEffect, useState } from "react";
import {
  buildAttendanceClockSnapshot,
  type AttendanceClockSnapshot,
} from "./attendanceDateTimeFormat";

const TICK_MS = 1000;

function nextSnapshotEquals(
  prev: AttendanceClockSnapshot,
  next: AttendanceClockSnapshot,
): boolean {
  return prev.dateLine === next.dateLine && prev.timeLine === next.timeLine;
}

export function useLiveAttendanceClock(): AttendanceClockSnapshot {
  const [snapshot, setSnapshot] = useState<AttendanceClockSnapshot>(() =>
    buildAttendanceClockSnapshot(new Date()),
  );

  useEffect(() => {
    const tick = () => {
      const next = buildAttendanceClockSnapshot(new Date());
      setSnapshot((prev) => (nextSnapshotEquals(prev, next) ? prev : next));
    };
    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return snapshot;
}
