export function formatImssEnrolledDate(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const raw = isoDate.trim();
  if (!raw) return null;

  const date = new Date(raw.length <= 10 ? `${raw}T12:00:00` : raw);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
