export function isWarehouseKeeperViewer(user: unknown, seller: unknown): boolean {
  const s = seller as { position?: { name?: string } } | null;
  if (s?.position?.name === "WarehouseKeeper") return true;

  const u = user as { rol?: string; position?: string | { name?: string } } | null;
  if (u?.rol === "WarehouseKeeper") return true;

  const up = u?.position;
  if (typeof up === "string" && up === "WarehouseKeeper") return true;
  if (up && typeof up === "object" && up.name === "WarehouseKeeper") return true;

  return false;
}
