const ROLE_LABELS_ES: Record<string, string> = {
  warehousekeeper: "Almacenista",
  almacenista: "Almacenista",
  seller: "Vendedor",
  vendedor: "Vendedor",
  supervisor: "Supervisor",
  supervisorgeneral: "Supervisor general",
  driver: "Chofer",
  chofer: "Chofer",
  cashier: "Cajero",
  cajero: "Cajero",
  admin: "Administrador",
  administrador: "Administrador",
  directivo: "Directivo",
  manager: "Gerente",
  gerente: "Gerente",
  finance: "Finanzas",
  finanzas: "Finanzas",
  customerservice: "Atención a clientes",
  support: "Atención a clientes",
  customer: "Cliente",
  cliente: "Cliente",
};

function normalizeRoleKey(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "")
    .toLowerCase();
}

export function mapWorkerRoleLabelEs(label: string): string {
  const raw = label?.trim();
  if (!raw) return "";
  return ROLE_LABELS_ES[normalizeRoleKey(raw)] ?? raw;
}

export function resolveWorkerRoleLabel(user: any, seller: any): string {
  const candidates = [
    seller?.position?.name,
    user?.rol,
    typeof user?.position === "string" ? user.position : user?.position?.name,
  ];

  for (const candidate of candidates) {
    const label = typeof candidate === "string" ? candidate.trim() : "";
    if (label) return mapWorkerRoleLabelEs(label);
  }

  return "Colaborador";
}
