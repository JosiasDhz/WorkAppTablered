const API_ROLE_TO_ES: Record<string, string> = {
  WarehouseKeeper: "Almacenista",
  Seller: "Vendedor",
  Supervisor: "Supervisor",
  Cashier: "Cajero",
  Directivo: "Directivo",
};

export function mapWorkerRoleLabelEs(label: string): string {
  const s = label?.trim();
  if (!s) return "";
  return API_ROLE_TO_ES[s] ?? s;
}
