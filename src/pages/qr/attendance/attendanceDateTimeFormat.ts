const LOCALE = "es-MX";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatAttendanceDateLine(at: Date): string {
  return capitalizeFirst(dateFormatter.format(at));
}

export function formatAttendanceTimeLine(at: Date): string {
  return timeFormatter.format(at);
}

export type AttendanceClockSnapshot = {
  dateLine: string;
  timeLine: string;
};

export function buildAttendanceClockSnapshot(at: Date): AttendanceClockSnapshot {
  return {
    dateLine: formatAttendanceDateLine(at),
    timeLine: formatAttendanceTimeLine(at),
  };
}
