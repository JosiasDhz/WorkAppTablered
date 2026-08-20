export function formatAttendanceClock(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatScheduleHmm(hmm: string | null): string | null {
  if (!hmm) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(hmm.trim());
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}
