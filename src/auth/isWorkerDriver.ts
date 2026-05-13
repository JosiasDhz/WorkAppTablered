export function isWorkerDriver(user: unknown): boolean {
  if (!user || typeof user !== "object") return false;
  const r = (user as { rol?: unknown }).rol;
  if (typeof r === "string") return r === "Driver";
  if (r && typeof r === "object" && "name" in r) {
    return (r as { name?: string }).name === "Driver";
  }
  return false;
}
