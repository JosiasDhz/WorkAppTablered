const MONTHS_ES_FULL = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export function formatWorkforceYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const month = MONTHS_ES_FULL[m - 1];
  if (!month) return ymd;
  return `${String(d).padStart(2, "0")} ${month} ${y}`;
}

export function formatWorkforceYmdRange(start: string, end: string): string {
  if (start === end) return formatWorkforceYmd(start);
  return `${formatWorkforceYmd(start)} — ${formatWorkforceYmd(end)}`;
}
