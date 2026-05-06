export function parseInventoryAuditCalendarDate(isoLike: string): Date {
  const ymd = isoLike.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return new Date(isoLike);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatInventoryAuditCalendarDateMX(isoLike: string): string {
  return parseInventoryAuditCalendarDate(isoLike).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
