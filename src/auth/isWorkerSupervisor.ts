function foldRoleKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "")
    .trim()
    .toLowerCase();
}

function readCandidateLabel(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name?: string }).name ?? "").trim();
  }
  return "";
}

export function isWorkerSupervisor(
  user: unknown,
  seller?: unknown,
): boolean {
  const candidates: unknown[] = [];
  if (user && typeof user === "object") {
    candidates.push((user as { rol?: unknown }).rol);
    candidates.push((user as { position?: unknown }).position);
  }
  if (seller && typeof seller === "object") {
    candidates.push((seller as { position?: unknown }).position);
  }

  for (const candidate of candidates) {
    const key = foldRoleKey(readCandidateLabel(candidate));
    if (key === "supervisor" || key === "supervisorgeneral") return true;
  }
  return false;
}
